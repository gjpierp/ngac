SET SERVEROUTPUT ON;

DECLARE
  v_usr NUMBER := 6;
  v_obj NUMBER := 274;
  v_op  VARCHAR2(30) := 'VER';
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== INICIO PRUEBA PKG_SEGURIDAD_ADMIN.P_OTORGAR_PERMISO ===');
  DBMS_OUTPUT.PUT_LINE('USR = ' || v_usr);
  DBMS_OUTPUT.PUT_LINE('OBJ = ' || v_obj);
  DBMS_OUTPUT.PUT_LINE('OP  = ' || v_op);

  NGAC_USER.pkg_seguridad_admin.p_otorgar_permiso(
    p_id_usr       => v_usr,
    p_id_obj       => v_obj,
    p_op           => v_op,
    p_condicion_js => NULL
  );

  DBMS_OUTPUT.PUT_LINE('=== FIN PRUEBA OK ===');
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('=== ERROR EN PRUEBA ===');
    DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE);
    DBMS_OUTPUT.PUT_LINE('SQLERRM: ' || SQLERRM);
    ROLLBACK;
    RAISE;
END;
/

SELECT
  a.id_usr_attr,
  nu.etiqueta,
  a.id_obj_attr,
  o.nombre_op,
  a.condicion_json,
  a.creado_por
FROM acc_asociaciones a
JOIN acc_operaciones o
  ON o.id_op = a.id_op
  Left Join acc_nodos nu on (a.id_usr_attr = nu.id_nodo)
WHERE a.id_usr_attr = 6
  AND a.id_obj_attr = 274
  AND UPPER(o.nombre_op) = 'VER';
  
  SELECT
  id_padre,
  id_hijo
FROM acc_asignaciones
WHERE id_padre = 6
  AND id_hijo = 274;