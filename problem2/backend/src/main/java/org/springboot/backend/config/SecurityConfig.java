package org.springboot.backend.config;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
public class SecurityConfig {
    @Bean SecurityFilterChain security(HttpSecurity http, ApiKeyAuthenticationFilter keys) throws Exception {
        return http.csrf(c -> c.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/health", "/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/packages/*/render/**", "/api/v1/packages/*/export/**").permitAll()
                        .requestMatchers("/api/v1/review/**").hasRole("REVIEWER")
                        .requestMatchers(HttpMethod.GET, "/api/v1/packages", "/api/v1/packages/**", "/api/v1/papers", "/api/v1/papers/**", "/api/v1/batches", "/api/v1/batches/**").hasAnyRole("PIPELINE", "REVIEWER")
                        .requestMatchers("/api/v1/**").hasRole("PIPELINE")
                        .anyRequest().denyAll())
                .addFilterBefore(keys, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
