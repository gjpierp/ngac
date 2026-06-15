ALTER SESSION SET CURRENT_SCHEMA = NGAC_USER;

DECLARE
  v_id_rol NUMBER;
  v_id_op_ver NUMBER;
  v_count NUMBER;
BEGIN
  -- Obtener el ID del rol
  SELECT id_nodo INTO v_id_rol FROM acc_nodos WHERE codigo_tecnico = 'ROL_JEFE_CONT';
  
  -- Obtener el ID de la operación VER
  SELECT id_op INTO v_id_op_ver FROM acc_operaciones WHERE nombre_op = 'VER';

  -- Iterar sobre los módulos de administración y agregar asociación si no existe
  FOR rec IN (
    SELECT id_nodo, codigo_tecnico 
    FROM acc_nodos 
    WHERE codigo_tecnico IN (
      'NODOS', 'TIPOS_NODOS', 'JERARQUIAS', 'ROLES_PERMISOS', 
      'OPERACIONES', 'USUARIOS', 'HOMOLOGACION_ROLES', 'ROLES', 
      'UNIDADES', 'ENTIDADES', 'CLONACION'
    )
  ) LOOP
    SELECT COUNT(*) INTO v_count 
    FROM acc_asociaciones 
    WHERE id_usr_attr = v_id_rol 
      AND id_obj_attr = rec.id_nodo 
      AND id_op = v_id_op_ver;
      
    IF v_count = 0 THEN
      INSERT INTO acc_asociaciones (id_usr_attr, id_obj_attr, id_op)
      VALUES (v_id_rol, rec.id_nodo, v_id_op_ver);
    END IF;
  END LOOP;
  
  COMMIT;
END;
/
EXIT;
