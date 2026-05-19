BEGIN
    pkg_seguridad_admin.p_upsert_operacion('VER', 'Permiso para ver');
    pkg_seguridad_admin.p_upsert_operacion('CREAR', 'Permiso para crear');
    pkg_seguridad_admin.p_upsert_operacion('EDITAR', 'Permiso para editar');
    pkg_seguridad_admin.p_upsert_operacion('ELIMINAR', 'Permiso para eliminar');
    pkg_seguridad_admin.p_upsert_operacion('EJECUTAR', 'Permiso para ejecutar');
    pkg_seguridad_admin.p_upsert_operacion('EXPORTAR', 'Permiso para exportar');
    pkg_seguridad_admin.p_upsert_operacion('APROBAR', 'Permiso para aprobar');
    pkg_seguridad_admin.p_upsert_operacion('AUDITAR', 'Permiso para auditar');
    pkg_seguridad_admin.p_upsert_operacion('IMPRIMIR', 'Permiso para imprimir');
    pkg_seguridad_admin.p_upsert_operacion('DESCARGAR', 'Permiso para descargar');
    COMMIT;
END;
/
