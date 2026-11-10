package com.sigem.backend;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

@TestConfiguration(proxyBeanMethods = false)
public class H2TestDataSourceGuard {

    @Bean
    static BeanFactoryPostProcessor requireIsolatedH2(Environment environment) {
        return beanFactory -> {
            String url = environment.getProperty("spring.datasource.url", "");
            String driver = environment.getProperty("spring.datasource.driver-class-name", "");
            String hikariDriver = environment.getProperty("spring.datasource.hikari.driver-class-name", "");
            String ddlAuto = environment.getProperty("spring.jpa.hibernate.ddl-auto", "");
            String sqlInit = environment.getProperty("spring.sql.init.mode", "");
            String hikariUrl = environment.getProperty("spring.datasource.hikari.jdbc-url", "");
            String jndiName = environment.getProperty("spring.datasource.jndi-name", "");
            String dataSourceType = environment.getProperty("spring.datasource.type", "");
            String dataSourceClass = environment.getProperty("spring.datasource.hikari.data-source-class-name", "");
            boolean flywayEnabled = environment.getProperty("spring.flyway.enabled", Boolean.class, false);
            if (!url.startsWith("jdbc:h2:mem:")
                    || (!hikariUrl.isBlank() && !hikariUrl.startsWith("jdbc:h2:mem:"))
                    || !"org.h2.Driver".equals(driver)
                    || (!hikariDriver.isBlank() && !"org.h2.Driver".equals(hikariDriver))
                    || !jndiName.isBlank()
                    || !dataSourceType.isBlank()
                    || !dataSourceClass.isBlank()
                    || !"create-drop".equals(ddlAuto)
                    || !"never".equals(sqlInit)
                    || flywayEnabled
                    || environment.acceptsProfiles(Profiles.of("bootstrap"))) {
                throw new IllegalStateException(
                        "Las pruebas requieren H2 en memoria, create-drop, SQL init/Flyway desactivados y sin perfil bootstrap");
            }
        };
    }
}
