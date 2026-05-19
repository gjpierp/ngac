BEGIN
    INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion) SELECT 'POLICY', 'Políticas de Acceso' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = 'POLICY');
    INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion) SELECT 'USR_ATTR', 'Atributos de Usuario (Roles)' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = 'USR_ATTR');
    INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion) SELECT 'USUARIO', 'Usuarios del Sistema' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = 'USUARIO');
    INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion) SELECT 'OBJ_ATTR', 'Atributos de Objeto' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = 'OBJ_ATTR');
    INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion) SELECT 'OBJETO', 'Objetos/Recursos (Menú)' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = 'OBJETO');
    COMMIT;
END;
/
