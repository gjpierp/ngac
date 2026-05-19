package com.safi.security.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Solicitud de validación de acceso basada en atributos (NGAC)")
public class AccessRequest {

    @Schema(description = "Slug identificador del usuario (ej: USR_GPAIVA)", example = "USR_GPAIVA")
    private String userSlug;

    @Schema(description = "Slug identificador del recurso/objeto (ej: MOD_TESORERIA)", example = "MOD_TESORERIA")
    private String objectSlug;

    @Schema(description = "Slug de la operación a realizar (ej: OP_READ)", example = "OP_READ")
    private String operationSlug;
}
