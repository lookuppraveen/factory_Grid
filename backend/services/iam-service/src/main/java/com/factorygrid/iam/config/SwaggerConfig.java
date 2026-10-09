package com.factorygrid.iam.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("FactoryGrid IAM Service API")
                        .description("Identity and Access Management Microservice for FactoryGrid B2B Pharmaceutical Procurement Platform.\n\n" +
                                "### Role-Based Access Isolation:\n" +
                                "- **BUYER**: Sourcing buyers accessing procurement, orders, and catalogs.\n" +
                                "- **SUPPLIER / MANUFACTURER**: Validated manufacturing units managing quotes, capacity, and production.\n" +
                                "- **ADMIN**: Platform administrators managing users, roles, and platform governance.\n" +
                                "- **COMPLIANCE_OFFICER**: Officers verifying KYC, FDA Drug Licenses, and GST.\n\n" +
                                "To authorize requests: Click **Authorize**, paste your JWT Bearer token, and test protected endpoints.")
                        .version("1.0.0")
                        .contact(new Contact().name("FactoryGrid Engineering Team").email("security@factorygrid.com"))
                        .license(new License().name("Proprietary").url("https://factorygrid.com")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token obtained from `/api/v1/auth/login`")));
    }
}
