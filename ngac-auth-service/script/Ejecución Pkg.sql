--SET SERVEROUTPUT ON SIZE UNLIMITED;

DECLARE
  v_contexto CLOB;
  v_result   CLOB;
BEGIN
  -- v_contexto corregido con sintaxis JSON estándar para el arreglo de atributos
  v_contexto := '{
    "sujeto": {
      "usuario_id": "13259698-0",
      "roles": ["ROL_JEFE_CONT"],
      "division": ""
    },
    "contexto": {
      "politicas": ["POLITICA_HOSPITAL"]
    },
    "solicitud": {
      "modulos": ["ADMINISTRACION", "PRESUPUESTO_HOSP"],
      "operaciones": ["VER", "CREAR", "EDITAR", "ELIMINAR"]
    },
    "atributos": ["unidad:HOSP"]
  }';

  -- Invocación al motor de decisión NGAC
  v_result := NGAC_USER.pkg_seguridad_ngac.fn_obtener_menu_json(v_contexto);

  -- Impresión del árbol de componentes resultante
  DBMS_OUTPUT.PUT_LINE(DBMS_LOB.SUBSTR(v_result, 32000, 1));
END;
/

-- Asegúrate de que el ID de la política y el ID de menú de ADMINISTRACION estén vinculados
INSERT INTO acc_policy_menu_raices (id_policy, id_menu_nodo, activo, creado_por)
VALUES (
    NGAC_USER.pkg_seguridad_admin.fn_resolve_node_id('POLITICA_HOSPITAL'),
    (SELECT id_menu_nodo FROM acc_menu_nodos WHERE id_nodo = NGAC_USER.pkg_seguridad_admin.fn_resolve_node_id('ADMINISTRACION') AND ROWNUM = 1),
    'S',
    USER
);
COMMIT;

BEGIN
  -- Ejemplo: Otorgar permiso de VER al ROL sobre el objeto hijo oculto
  NGAC_USER.pkg_seguridad_admin.p_otorgar_permiso(
      p_id_usr => NGAC_USER.pkg_seguridad_admin.fn_resolve_node_id('ROL_JEFE_CONT'),
      p_id_obj => NGAC_USER.pkg_seguridad_admin.fn_resolve_node_id('CODIGO_DEL_HIJO_OCULTO'),
      p_id_op  => NGAC_USER.pkg_seguridad_admin.fn_resolve_operacion_id('VER')
  );
  COMMIT;
END;
/