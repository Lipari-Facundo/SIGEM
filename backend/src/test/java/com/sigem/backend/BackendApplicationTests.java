package com.sigem.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:backend-context;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"sigem.jwt.secret-base64=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"spring.sql.init.mode=never",
		"spring.flyway.enabled=false"
})
@Import(H2TestDataSourceGuard.class)
class BackendApplicationTests {

	@MockBean(name = "initData")
	private CommandLineRunner initData;

	@Test
	void contextLoads() {
	}

}
