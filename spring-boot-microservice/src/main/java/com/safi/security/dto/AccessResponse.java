package com.safi.security.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Respuesta detallada del motor NGAC generada por Oracle")
public class AccessResponse {

    @Schema(description = "Indica si el acceso es permitido (1) o denegado (0)", example = "1")
    private Integer granted;

    @Schema(description = "Mensaje descriptivo del resultado de la política", example = "Acceso permitido por jerarquía de roles")
    private String message;

    @Schema(description = "ID de la política aplicada en Oracle", example = "POL_GLOBAL_001")
    private String policyId;

    @Schema(description = "Timestamp de la evaluación en el servidor DB", example = "2026-05-13T10:00:00Z")
    private String timestamp;
}
