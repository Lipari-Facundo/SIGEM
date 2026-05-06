package com.sigem.backend.config;

import com.sigem.backend.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          UserDetailsService userDetailsService,
                          PasswordEncoder passwordEncoder) { // <--- AGREGÁ ESTO
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder; // <--- AGREGÁ ESTO
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Deshabilitamos CSRF porque usamos JWT (stateless), no cookies de sesión
                .csrf(AbstractHttpConfigurer::disable)

                // Configuramos CORS para permitir requests del frontend (localhost:5173)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Definimos qué rutas son públicas y cuáles requieren autenticación
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()  // Login es público
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/*/estado").hasRole("ADM")
                        .requestMatchers("/api/usuarios/**").hasRole("ADM")
                        .anyRequest().authenticated()                  // Todo lo demás requiere JWT
                )

                // Sin sesiones — cada request debe traer su JWT
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Registramos nuestro proveedor de autenticación
                .authenticationProvider(authenticationProvider())

                // Agregamos nuestro filtro JWT antes del filtro estándar de usuario/contraseña
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173")); // URL del frontend
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        return source -> {
            UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
            src.registerCorsConfiguration("/**", config);
            return src.getCorsConfiguration(source);
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

}