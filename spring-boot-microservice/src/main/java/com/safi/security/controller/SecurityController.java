package com.safi.security.controller;

import com.safi.security.dto.AccessRequest;
import com.safi.security.dto.AccessResponse;
import com.safi.security.repository.SecurityRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/security")
@Tag(name = "NGAC Security Engine", description = "Endpoints para la validación de accesos vía motor PL/SQL")
public class SecurityController {

    private final SecurityRepository securityRepository;

    public SecurityController(SecurityRepository securityRepository) {
        this.securityRepository = securityRepository;
    }

    @Operation(
        summary = "Verificar Acceso NGAC",
        description = "Invoca la función PL/SQL 'pkg_ngac_security.check_access' para validar permisos basados en atributos."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Evaluación completada exitosamente",
            content = @Content(schema = @Schema(implementation = AccessResponse.class))
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Acceso Denegado por Política NGAC (Error PLS-20001)"
        ),
        @ApiResponse(
            responseCode = "500", 
            description = "Error interno en el motor de base de datos"
        )
    })
    @PostMapping("/check")
    public AccessResponse checkAccess(
        @RequestBody 
        @Parameter(description = "DTO de solicitud con Slugs de Oracle (ej: USR_SLUG, OBJ_SLUG, OP_SLUG)") 
        AccessRequest request
    ) {
        return securityRepository.executeCheckAccess(request);
    }
}
