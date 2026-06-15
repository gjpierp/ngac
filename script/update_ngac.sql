CREATE OR REPLACE PROCEDURE pkg_seguridad_admin.p_upsert_nodo (
    p_id_nodo      IN NUMBER,
    p_codigo       IN VARCHAR2,
    p_etiqueta     IN VARCHAR2,
    p_id_tipo_nodo IN NUMBER,
    p_ruta         IN VARCHAR2,
    p_slug         IN VARCHAR2,
    p_icono        IN VARCHAR2,
    p_descripcion  IN VARCHAR2,
    p_orden        IN NUMBER,
    p_activo       IN VARCHAR2
) AS
BEGIN
    MERGE INTO SAFI_NODOS t
    USING (SELECT p_id_nodo AS id_nodo FROM dual) s
    ON (t.id_nodo = s.id_nodo OR t.codigo = p_codigo)
    WHEN MATCHED THEN
        UPDATE SET 
            etiqueta = p_etiqueta,
            id_tipo_nodo = p_id_tipo_nodo,
            ruta = p_ruta,
            slug = p_slug,
            icono = p_icono,
            descripcion = p_descripcion,
            orden = p_orden,
            activo = NVL(p_activo, 'S'),
            fecha_modificacion = SYSDATE
    WHEN NOT MATCHED THEN
        INSERT (id_nodo, codigo, etiqueta, id_tipo_nodo, ruta, slug, icono, descripcion, orden, activo, fecha_creacion)
        VALUES (NVL(p_id_nodo, seq_safi_nodos.NEXTVAL), p_codigo, p_etiqueta, p_id_tipo_nodo, p_ruta, p_slug, p_icono, p_descripcion, p_orden, NVL(p_activo, 'S'), SYSDATE);
END p_upsert_nodo;
/

CREATE OR REPLACE FUNCTION pkg_seguridad_admin.getModulosRaiz RETURN SYS_REFCURSOR AS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT id_nodo, codigo, etiqueta, descripcion, icono 
        FROM SAFI_NODOS 
        WHERE activo = 'S' 
        AND id_nodo NOT IN (SELECT id_hijo FROM SAFI_ENLACES); 
    RETURN v_cursor;
END getModulosRaiz;
/

CREATE OR REPLACE FUNCTION pkg_seguridad_admin.get_jerarquia_con_politicas(p_id_raiz IN NUMBER) RETURN SYS_REFCURSOR AS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        WITH jerarquia_nodos AS (
            SELECT n.id_nodo, n.etiqueta, n.id_tipo_nodo, e.id_padre, 1 as nivel,
                   p.codigo as politica_heredada
            FROM SAFI_NODOS n
            LEFT JOIN SAFI_ENLACES e ON n.id_nodo = e.id_hijo
            LEFT JOIN SAFI_POLITICAS p ON n.id_nodo = p.id_nodo_raiz
            WHERE n.id_nodo = p_id_raiz
            UNION ALL
            SELECT h.id_nodo, h.etiqueta, h.id_tipo_nodo, he.id_padre, j.nivel + 1,
                   j.politica_heredada
            FROM SAFI_NODOS h
            JOIN SAFI_ENLACES he ON h.id_nodo = he.id_hijo
            JOIN jerarquia_nodos j ON he.id_padre = j.id_nodo
        )
        SELECT * FROM jerarquia_nodos;
    RETURN v_cursor;
END get_jerarquia_con_politicas;
/
exit;
