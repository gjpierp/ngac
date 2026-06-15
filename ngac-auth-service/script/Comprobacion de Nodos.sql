SELECT
  n.id_nodo,
  n.codigo_tecnico,
  n.etiqueta,
  n.activo,
  n.id_tipo_nodo,
  t.codigo_tipo AS tipo_nodo
FROM acc_nodos n
LEFT JOIN acc_tipos_nodo t
  ON t.id_tipo_nodo = n.id_tipo_nodo
--WHERE UPPER(n.codigo_tecnico) LIKE ('%HOSP%')
WHERE UPPER(n.codigo_tecnico) IN (
  'POLITICA_HOSPITAL',
  'PRESUPUESTO_HOSP',
  'ROL_JEFE_CONTA',
  'ROL_JEFE_CONT',
  'ADMINISTRACION',
  'PRESUPUESTO'
)
ORDER BY n.codigo_tecnico;