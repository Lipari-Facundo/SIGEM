package com.sigem.backend.config;

import com.sigem.backend.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

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
                          PasswordEncoder passwordEncoder) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()

                // ── Usuarios ──────────────────────────────────────────────
                .requestMatchers("/api/usuarios/me").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/usuarios/me").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/usuarios/*/estado").hasRole("ADM")
                .requestMatchers("/api/usuarios/**").hasRole("ADM")

                // ── Móviles ───────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/moviles/operativos")
                    .hasAnyRole("ADM", "DES", "ENF", "JEF")
                .requestMatchers(HttpMethod.GET, "/api/moviles")
                    .hasAnyRole("ADM", "DES")
                .requestMatchers(HttpMethod.POST, "/api/moviles").hasRole("ADM")
                .requestMatchers(HttpMethod.PUT, "/api/moviles/*/estado")
                    .hasAnyRole("ADM", "DES")
                .requestMatchers(HttpMethod.PUT, "/api/moviles/*").hasRole("ADM")
                .requestMatchers(HttpMethod.DELETE, "/api/moviles/*").hasRole("ADM")

                // ── Guardias ──────────────────────────────────────────────
                .requestMatchers("/api/guardias/**").hasAnyRole("ENF", "JEF")

                // ── Incidentes ────────────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/incidentes").hasRole("DES")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/guardias-disponibles")
                    .hasRole("DES")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/seguimiento")
                    .hasRole("DES")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/asignados")
                    .hasAnyRole("ENF", "JEF")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/atenciones-hoy")
                    .hasAnyRole("ENF", "JEF")
                .requestMatchers(HttpMethod.PUT, "/api/incidentes/*/estado")
                    .hasAnyRole("ENF", "JEF")

                .anyRequest().authenticated()
            )
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
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
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}