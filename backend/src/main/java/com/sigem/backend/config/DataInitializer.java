package com.sigem.backend.config;

import com.sigem.backend.model.Rol;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UsuarioRepository usuarioRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            if (!usuarioRepository.existsByUsername("admin")) {
                Usuario admin = new Usuario();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setNombre("Administrador");
                admin.setApellido("Sistema");
                admin.setEmail("admin@sigem.com");
                admin.setRol(Rol.ADM);
                admin.setActivo(true);
                usuarioRepository.save(admin);
                System.out.println(">>> Usuario admin creado correctamente");
            }
        };
    }
}