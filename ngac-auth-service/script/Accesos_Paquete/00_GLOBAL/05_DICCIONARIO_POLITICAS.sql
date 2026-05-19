BEGIN
    pkg_seguridad_admin.p_upsert_nodo('POLICY_MENU', 'Política de Interfaz y Roles', 'POLICY', NULL, NULL, 'policy', 0);
    pkg_seguridad_admin.p_upsert_nodo('POLICY_HORARIO', 'Política de Franjas Horarias', 'POLICY', NULL, NULL, 'policy', 0);
    pkg_seguridad_admin.p_upsert_nodo('POLICY_CONFIDENCIALIDAD', 'Política de Clasificación de Datos', 'POLICY', NULL, NULL, 'policy', 0);
    pkg_seguridad_admin.p_upsert_nodo('HORARIO_OFICINA', 'Horario Hábil (Lu-Vi 09-18)', 'POLICY', NULL, NULL, 'policy', 0);
    pkg_seguridad_admin.p_upsert_nodo('HORARIO_EXTENDIDO', 'Horario Extendido (24/7)', 'POLICY', NULL, NULL, 'policy', 0);
    pkg_seguridad_admin.p_upsert_nodo('NIVEL_PUBLICO', 'Datos Públicos', 'POLICY', NULL, NULL, 'policy', 0);
    pkg_seguridad_admin.p_upsert_nodo('NIVEL_INTERNO', 'Datos Uso Interno', 'POLICY', NULL, NULL, 'policy', 0);
    pkg_seguridad_admin.p_upsert_nodo('NIVEL_RESTRINGIDO', 'Datos Financieros Restringidos', 'POLICY', NULL, NULL, 'policy', 0);
    COMMIT;
END;
/
