const oracledb = require('oracledb');

async function run() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: "NGAC_USER",
      password: "G3rC4t_01",
      connectString: "localhost:1521/XEPDB1"
    });

    // Find PRESUPUESTO root
    const root = await connection.execute(
      `SELECT id_nodo, etiqueta FROM acc_nodos WHERE upper(etiqueta) = 'PRESUPUESTO' AND activo = 'S'`
    );
    console.log("Root:", root.rows);
    
    // Find all nodes under PRESUPUESTO
    const tree = await connection.execute(
      `WITH jerarquia (id_nodo, id_padre, nivel) AS (
         SELECT id_nodo, TO_NUMBER(NULL), 0 FROM acc_nodos WHERE etiqueta = 'PRESUPUESTO'
         UNION ALL
         SELECT a.id_hijo, a.id_padre, j.nivel + 1 
         FROM acc_asignaciones a
         JOIN jerarquia j ON a.id_padre = j.id_nodo
         WHERE a.activo = 'S'
       )
       SELECT j.id_nodo, n.etiqueta, j.id_padre, j.nivel
       FROM jerarquia j
       JOIN acc_nodos n ON j.id_nodo = n.id_nodo
       ORDER BY j.nivel, n.etiqueta`
    );
    console.log("PRESUPUESTO tree:");
    console.table(tree.rows);

    const hospTree = await connection.execute(
      `WITH jerarquia (id_nodo, id_padre, nivel) AS (
         SELECT id_nodo, TO_NUMBER(NULL), 0 FROM acc_nodos WHERE etiqueta = 'PRESUPUESTO_HOSP'
         UNION ALL
         SELECT a.id_hijo, a.id_padre, j.nivel + 1 
         FROM acc_asignaciones a
         JOIN jerarquia j ON a.id_padre = j.id_nodo
         WHERE a.activo = 'S'
       )
       SELECT j.id_nodo, n.etiqueta, j.id_padre, j.nivel
       FROM jerarquia j
       JOIN acc_nodos n ON j.id_nodo = n.id_nodo
       ORDER BY j.nivel, n.etiqueta`
    );
    console.log("PRESUPUESTO_HOSP tree:");
    console.table(hospTree.rows);

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();
