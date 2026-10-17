package org.springboot.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI metaboQuestOpenApi() {
        return new OpenAPI().info(new Info()
                .title("MetaboQuest API")
                .version("v1")
                .description("Anonymous educational metabolic-health quiz, results, friend challenges, and consent-aware analytics.")
                .contact(new Contact().name("Steer Club"))
                .license(new License().name("Proprietary")));
    }
}
