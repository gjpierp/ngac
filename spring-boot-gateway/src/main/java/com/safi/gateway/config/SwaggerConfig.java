package com.safi.gateway.config;

import org.springdoc.core.properties.AbstractSwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springframework.cloud.gateway.route.RouteDefinitionLocator;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class SwaggerConfig {

    public SwaggerConfig(RouteDefinitionLocator locator, SwaggerUiConfigProperties swaggerUiConfigProperties) {
        List<org.springframework.cloud.gateway.route.RouteDefinition> definitions = locator.getRouteDefinitions().collectList().block();
        
        Set<AbstractSwaggerUiConfigProperties.SwaggerUrl> urls = new HashSet<>();
        
        definitions.stream()
            .filter(routeDefinition -> routeDefinition.getId().matches(".*-service")) // Filtra servicios registrados
            .forEach(routeDefinition -> {
                String name = routeDefinition.getId().replace("-service", "");
                AbstractSwaggerUiConfigProperties.SwaggerUrl swaggerUrl = new AbstractSwaggerUiConfigProperties.SwaggerUrl(
                    name, 
                    "/" + routeDefinition.getId() + "/v3/api-docs", 
                    name
                );
                urls.add(swaggerUrl);
            });
        
        swaggerUiConfigProperties.setUrls(urls);
    }
}
