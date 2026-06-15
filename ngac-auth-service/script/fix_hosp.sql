ALTER SESSION SET CURRENT_SCHEMA = NGAC_USER;

BEGIN
    -- Eliminar los enlaces defectuosos del menú
    DELETE FROM acc_menu_asignaciones 
    WHERE id_menu_padre IN (SELECT id_menu_nodo FROM acc_menu_nodos WHERE id_nodo = 1774);
    
    -- Eliminar los enlaces defectuosos estructurales
    DELETE FROM acc_asignaciones 
    WHERE id_padre = 1774;
    
    -- Volver a clonar la jerarquía de PRESUPUESTO (259) a PRESUPUESTO_HOSP (1774)
    PKG_SEGURIDAD_ADMIN.p_clonar_jerarquia(1774, 259);
    
    COMMIT;
END;
/
EXIT;
