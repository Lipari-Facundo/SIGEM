package com.sigem.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class H2TestDataSourceGuardTest {

    @Test
    void acceptsOnlyIsolatedH2TestConfiguration() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url", "jdbc:h2:mem:guard-test")
                .withProperty("spring.datasource.driver-class-name", "org.h2.Driver")
                .withProperty("spring.jpa.hibernate.ddl-auto", "create-drop")
                .withProperty("spring.sql.init.mode", "never")
                .withProperty("spring.flyway.enabled", "false");

        assertDoesNotThrow(() -> H2TestDataSourceGuard.requireIsolatedH2(environment)
                .postProcessBeanFactory(new DefaultListableBeanFactory()));

        environment.setProperty("spring.datasource.url", "jdbc:postgresql://localhost/sigem_dev");
        assertThrows(IllegalStateException.class,
                () -> H2TestDataSourceGuard.requireIsolatedH2(environment)
                        .postProcessBeanFactory(new DefaultListableBeanFactory()));

        environment.setProperty("spring.datasource.url", "jdbc:h2:mem:guard-test");
        environment.setProperty("spring.datasource.hikari.driver-class-name", "org.postgresql.Driver");
        assertThrows(IllegalStateException.class,
                () -> H2TestDataSourceGuard.requireIsolatedH2(environment)
                        .postProcessBeanFactory(new DefaultListableBeanFactory()));
    }
}
