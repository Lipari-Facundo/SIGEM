package com.sigem.backend.config;

import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class HibernateSchemaValidationConfiguration {

    @Bean
    HibernatePropertiesCustomizer enforceSchemaValidation() {
        return properties -> properties.put("hibernate.hbm2ddl.auto", "validate");
    }
}
