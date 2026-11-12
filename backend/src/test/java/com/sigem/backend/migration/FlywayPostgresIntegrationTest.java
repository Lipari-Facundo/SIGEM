package com.sigem.backend.migration;

import com.sigem.backend.BackendApplication;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@EnabledIfEnvironmentVariable(named = "SIGEM_FLYWAY_TEST_URL", matches = "jdbc:postgresql:.*")
class FlywayPostgresIntegrationTest {

    @Test
    void appliesOnlyPendingMigrationAndDoesNotRepeatAppliedVersions() {
        String url = System.getenv("SIGEM_FLYWAY_TEST_URL");
        String username = System.getenv("SIGEM_FLYWAY_TEST_USERNAME");
        String password = System.getenv("SIGEM_FLYWAY_TEST_PASSWORD");
        Flyway historicalFlyway = Flyway.configure()
                .dataSource(url, username, password)
                .locations("classpath:db/migration")
                .target("20261111234600")
                .baselineOnMigrate(false)
                .outOfOrder(true)
                .cleanDisabled(true)
                .load();

        assertEquals(9, historicalFlyway.migrate().migrationsExecuted);

        Flyway flyway = flyway(
                url, username, password);

        assertEquals(1, flyway.info().pending().length);
        assertEquals("20261112010000", flyway.info().pending()[0].getVersion().getVersion());
        assertEquals(1, flyway.migrate().migrationsExecuted);
        assertEquals(0, flyway.info().pending().length);
        assertEquals(0, flyway.migrate().migrationsExecuted);
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "SIGEM_FLYWAY_MIGRATED_URL", matches = "jdbc:postgresql:.*")
    void leavesFullyMigratedDatabaseUnchanged() {
        Flyway flyway = flyway(
                System.getenv("SIGEM_FLYWAY_MIGRATED_URL"),
                System.getenv("SIGEM_FLYWAY_TEST_USERNAME"),
                System.getenv("SIGEM_FLYWAY_TEST_PASSWORD"));

        assertEquals(0, flyway.info().pending().length);
        assertEquals(0, flyway.migrate().migrationsExecuted);
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "SIGEM_FLYWAY_INCOMPATIBLE_URL", matches = "jdbc:postgresql:.*")
    void refusesNonEmptySchemaWithoutHistoryAndPreservesExistingRows() throws Exception {
        String url = System.getenv("SIGEM_FLYWAY_INCOMPATIBLE_URL");
        String username = System.getenv("SIGEM_FLYWAY_TEST_USERNAME");
        String password = System.getenv("SIGEM_FLYWAY_TEST_PASSWORD");

        assertThrows(FlywayException.class, () -> flyway(url, username, password).migrate());

        try (var connection = DriverManager.getConnection(url, username, password);
             var statement = connection.createStatement();
             var result = statement.executeQuery("SELECT id FROM usuarios WHERE id = 17")) {
            assertTrue(result.next());
            assertEquals(17, result.getLong("id"));
            assertTrue(!result.next());
        }
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "SIGEM_FLYWAY_INCOMPATIBLE_STRUCTURE_URL", matches = "jdbc:postgresql:.*")
    void refusesTrackedPartialSchemaAndPreservesExistingRows() throws Exception {
        String url = System.getenv("SIGEM_FLYWAY_INCOMPATIBLE_STRUCTURE_URL");
        String username = System.getenv("SIGEM_FLYWAY_TEST_USERNAME");
        String password = System.getenv("SIGEM_FLYWAY_TEST_PASSWORD");

        try (var connection = DriverManager.getConnection(url, username, password);
             var statement = connection.createStatement()) {
            statement.execute("CREATE TABLE usuarios (id bigint PRIMARY KEY)");
            statement.execute("INSERT INTO usuarios (id) VALUES (17)");
        }

        Flyway flyway = Flyway.configure()
                .dataSource(url, username, password)
                .locations("classpath:db/migration")
                .baselineVersion("20261109159999")
                .baselineOnMigrate(false)
                .outOfOrder(true)
                .cleanDisabled(true)
                .load();

        flyway.baseline();
        assertThrows(FlywayException.class, flyway::migrate);

        try (var connection = DriverManager.getConnection(url, username, password);
             var statement = connection.createStatement();
             var result = statement.executeQuery("SELECT id FROM usuarios WHERE id = 17")) {
            assertTrue(result.next());
            assertEquals(17, result.getLong("id"));
            assertTrue(!result.next());
        }
        try (var connection = DriverManager.getConnection(url, username, password);
             var statement = connection.createStatement();
             var result = statement.executeQuery(
                     "SELECT to_regclass('public.moviles') IS NULL AS missing_table")) {
            assertTrue(result.next());
            assertTrue(result.getBoolean("missing_table"));
        }
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "SIGEM_FLYWAY_FAILURE_URL", matches = "jdbc:postgresql:.*")
    void preventsApplicationStartupWhenMigrationFails(@TempDir Path migrationDirectory) throws IOException {
        Files.writeString(migrationDirectory.resolve("V1__intentional_failure.sql"), "NOT VALID SQL;\n");
        String location = "filesystem:" + migrationDirectory.toAbsolutePath().toString().replace("\\", "/");

        RuntimeException failure = assertThrows(RuntimeException.class, () -> {
            try (ConfigurableApplicationContext ignored = new SpringApplicationBuilder(BackendApplication.class)
                    .web(WebApplicationType.NONE)
                    .run(
                            "--spring.datasource.url=" + System.getenv("SIGEM_FLYWAY_FAILURE_URL"),
                            "--spring.datasource.username=" + System.getenv("SIGEM_FLYWAY_TEST_USERNAME"),
                            "--spring.datasource.password=" + System.getenv("SIGEM_FLYWAY_TEST_PASSWORD"),
                            "--spring.datasource.driver-class-name=org.postgresql.Driver",
                            "--spring.flyway.enabled=true",
                            "--spring.flyway.baseline-on-migrate=false",
                            "--spring.flyway.clean-disabled=true",
                            "--spring.flyway.locations=" + location,
                            "--spring.jpa.hibernate.ddl-auto=validate",
                            "--spring.sql.init.mode=never",
                            "--sigem.jwt.secret-base64=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")) {
                throw new AssertionError("Application started despite a failed migration");
            }
        });

        assertTrue(hasCause(failure, FlywayException.class));
    }

    private Flyway flyway(String url, String username, String password) {
        return Flyway.configure()
                .dataSource(url, username, password)
                .locations("classpath:db/migration")
                .baselineOnMigrate(false)
                .outOfOrder(true)
                .cleanDisabled(true)
                .load();
    }

    private boolean hasCause(Throwable failure, Class<? extends Throwable> expectedType) {
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            if (expectedType.isInstance(cause)) {
                return true;
            }
        }
        return false;
    }
}
