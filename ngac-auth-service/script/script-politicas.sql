DECLARE
    v_count NUMBER;
BEGIN

    FOR r IN (
        SELECT n.codigo_tecnico, n.id_nodo
        FROM acc_nodos n
        JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
        WHERE n.activo = 'S'
          AND (
                 n.codigo_tecnico LIKE 'CONTABILIDAD%' OR
                 n.codigo_tecnico LIKE 'PRESUPUESTO%' OR
                 n.codigo_tecnico LIKE 'VIATICO_MONEDA_NACIONAL%' OR
                 n.codigo_tecnico LIKE 'CONCILIACION_CKS%' OR
                 n.codigo_tecnico LIKE 'CAJA%' OR
                 n.codigo_tecnico LIKE 'COMPRAS%' OR
                 n.codigo_tecnico LIKE 'DECRETOS%' OR
                 n.codigo_tecnico LIKE 'LICENCIAS_MEDICAS%' OR
                 n.codigo_tecnico LIKE 'DESCUENTOS%' OR
                 n.codigo_tecnico LIKE 'ALIMENTACION%' OR
                 n.codigo_tecnico LIKE 'VIATICO_MONEDA_EXTRANJERA%' OR
                 n.codigo_tecnico LIKE 'ACTIVO_FIJO_INFRAESCTRUCTURA%' OR
                 n.codigo_tecnico LIKE 'COMPRAS_EXTRANJERA_COMEX%' OR
                 n.codigo_tecnico LIKE 'CONSOLIDADO%'
          )
          AND NOT EXISTS (
              SELECT 1 FROM acc_asignaciones a WHERE a.id_hijo = n.id_nodo
          )
    ) LOOP
        pkg_seguridad_admin.p_enlazar_nodos('POLICY_MENU', r.codigo_tecnico);
        DBMS_OUTPUT.PUT_LINE('Enlazado módulo raíz a PC_MENU: ' || r.codigo_tecnico);
    END LOOP;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Configuración de Políticas y Enlaces completada con éxito.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error en el script: ' || SQLERRM);
END;
/
/*
SELECT * FROM ACC_ASIGNACIONES aa WHERE aa.ID_HIJO  IN (1576);
DELETE FROM ACC_ASIGNACIONES WHERE id_asignacion = 1700;
*/