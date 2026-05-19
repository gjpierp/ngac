package com.safi.security.repository;

import com.safi.security.dto.AccessRequest;
import com.safi.security.dto.AccessResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.HashMap;
import java.util.Map;

@Repository
public class SecurityRepository {

    private final JdbcTemplate jdbcTemplate;

    public SecurityRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Llama a pkg_ngac_security.check_access
     * Parámetros basados en Slugs definidos en Oracle.
     */
    public AccessResponse executeCheckAccess(AccessRequest request) {
        SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
            .withSchemaName("NGAC_USER")
            .withPackageName("PKG_NGAC_SECURITY")
            .withFunctionName("CHECK_ACCESS")
            .declareParameters(
                new SqlParameter("P_USR_SLUG", Types.VARCHAR),
                new SqlParameter("P_OBJ_SLUG", Types.VARCHAR),
                new SqlParameter("P_OP_SLUG", Types.VARCHAR),
                new SqlOutParameter("P_RESULT_JSON", Types.CLOB)
            );

        Map<String, Object> inParams = new HashMap<>();
        inParams.put("P_USR_SLUG", request.getUserSlug());
        inParams.put("P_OBJ_SLUG", request.getObjectSlug());
        inParams.put("P_OP_SLUG", request.getOperationSlug());

        String jsonResult = jdbcCall.executeFunction(String.class, inParams);
        
        // Mapeo manual o vía Jackson del JSON retornado por Oracle
        return parseJsonResponse(jsonResult);
    }

    private AccessResponse parseJsonResponse(String json) {
        // Implementación de parsing...
        return new AccessResponse(); 
    }
}
