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
                    .hasAnyRole("ADM", "DES", "ENF")
                .requestMatchers(HttpMethod.GET, "/api/moviles")
                    .hasAnyRole("ADM", "DES")
                .requestMatchers(HttpMethod.POST, "/api/moviles").hasRole("ADM")
                .requestMatchers(HttpMethod.PUT, "/api/moviles/*/estado")
                    .hasAnyRole("ADM", "DES")
                .requestMatchers(HttpMethod.PUT, "/api/moviles/*").hasRole("ADM")
                .requestMatchers(HttpMethod.DELETE, "/api/moviles/*").hasRole("ADM")

                // ── Inventario de móviles ───────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/inventario/mi-movil")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/inventario/movil/*")
                    .hasAnyRole("ADM", "DES")
                .requestMatchers(HttpMethod.POST, "/api/inventario/movil/*/inicializar")
                    .hasRole("ADM")
                .requestMatchers(HttpMethod.POST, "/api/inventario/consumo")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/inventario/mi-movil/historial")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/inventario/movil/*/historial")
                    .hasAnyRole("ADM", "DES")
                .requestMatchers(HttpMethod.GET, "/api/inventario/mi-movil/sugerencia-reposicion")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.POST, "/api/inventario/reposicion")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/inventario/reposicion/mias")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.PUT, "/api/inventario/reposicion/*/cancelar")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/inventario/reposicion/pendientes")
                    .hasAnyRole("DES", "ADM", "JEF")
                .requestMatchers(HttpMethod.POST, "/api/inventario/reposicion/*/entregas")
                    .hasAnyRole("ADM", "JEF")
                .requestMatchers(HttpMethod.PUT, "/api/inventario/reposicion/*/rechazar")
                    .hasAnyRole("ADM", "JEF")

                // ── Depósito central ──────────────────────────────────────
                .requestMatchers("/api/deposito-central/**")
                    .hasAnyRole("ADM", "JEF")

                // ── Controles de móvil ────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/controles/mi-movil/plantilla")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/controles/mis")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.POST, "/api/controles")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/controles")
                    .hasAnyRole("JEF", "ADM", "DIR")
                .requestMatchers(HttpMethod.GET, "/api/controles/*")
                    .hasAnyRole("ENF", "JEF", "ADM", "DIR")

                // ── Guardias ──────────────────────────────────────────────
                .requestMatchers("/api/guardias/**").hasAnyRole("ENF", "JEF")

                // ── Notificaciones ────────────────────────────────────────
                .requestMatchers("/api/notificaciones/**").hasAnyRole("ENF", "JEF", "DES")

                // ── Incidentes ────────────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/incidentes").hasRole("DES")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/guardias-disponibles")
                    .hasRole("DES")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/seguimiento")
                    .hasRole("DES")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/asignados")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/atenciones-hoy")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.GET, "/api/incidentes")
                    .hasAnyRole("DIR", "ADM")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/metricas-ugl")
                    .hasAnyRole("DIR", "ADM")
                .requestMatchers(HttpMethod.PUT, "/api/incidentes/*/estado")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.PUT, "/api/incidentes/*/rechazar")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.PUT, "/api/incidentes/*/llegada")
                    .hasRole("ENF")
                .requestMatchers(HttpMethod.PUT, "/api/incidentes/*/reasignar")
                    .hasRole("DES")
                .requestMatchers(HttpMethod.GET, "/api/incidentes/pendientes-reasignacion")
                    .hasRole("DES")

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