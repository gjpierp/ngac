const oracledb = require('oracledb');

async function run() {
  let conn;
  try {
    conn = await oracledb.getConnection({user: 'NGAC_USER', password: 'G3rC4t_01', connectString: 'localhost:1521/XEPDB1'});

    const asoRes = await conn.execute(`
      SELECT aso.id_usr_attr, aso.id_obj_attr, aso.id_op, aso.condicion_json
      FROM acc_asociaciones aso
      WHERE aso.condicion_json IS NULL OR aso.condicion_json NOT LIKE '%/*POL:%'
    `);
    
    const rootsRes = await conn.execute(`
      SELECT pmr.id_policy, mn.id_nodo as root_nodo
      FROM acc_policy_menu_raices pmr
      JOIN acc_menu_nodos mn ON mn.id_menu_nodo = pmr.id_menu_nodo
      WHERE pmr.activo = 'S'
    `);

    const linksRes = await conn.execute(`SELECT id_padre, id_hijo FROM acc_asignaciones`);
    const childrenMap = new Map();
    const parentMap = new Map();
    for (const link of linksRes.rows) {
      if (!childrenMap.has(link[0])) childrenMap.set(link[0], new Set());
      childrenMap.get(link[0]).add(link[1]);
      
      if (!parentMap.has(link[1])) parentMap.set(link[1], new Set());
      parentMap.get(link[1]).add(link[0]);
    }

    const getAncestors = (nodeId) => {
      const ancestors = new Set();
      const queue = [nodeId];
      while(queue.length > 0) {
        const curr = queue.shift();
        const parents = parentMap.get(curr) || [];
        for (const p of parents) {
          if (!ancestors.has(p)) {
            ancestors.add(p);
            queue.push(p);
          }
        }
      }
      return ancestors;
    };

    const policyRoots = new Map(); 
    for (const r of rootsRes.rows) {
      policyRoots.set(r[1], r[0]);
    }

    const updates = [];

    for (const aso of asoRes.rows) {
      const roleId = aso[0];
      const nodeId = aso[1];
      const opId = aso[2];
      const cond = aso[3];

      const roleAncestors = getAncestors(nodeId);
      roleAncestors.add(nodeId);

      let assignedPolicies = new Set();
      for (const root of policyRoots.keys()) {
        if (roleAncestors.has(root)) {
          assignedPolicies.add(policyRoots.get(root));
        }
      }

      if (assignedPolicies.size === 1) {
        const policyId = Array.from(assignedPolicies)[0];
        updates.push({ roleId, nodeId, opId, cond, policyId });
      } else if (assignedPolicies.size > 1) {
        const roleDescendants = new Set();
        const queue = [roleId];
        while(queue.length > 0) {
           const curr = queue.shift();
           const children = childrenMap.get(curr) || [];
           for(const c of children) {
              if (!roleDescendants.has(c)) {
                 roleDescendants.add(c);
                 queue.push(c);
              }
           }
        }
        
        let validPolicies = [];
        for(const pol of assignedPolicies) {
           const rootsForPol = Array.from(policyRoots.keys()).filter(k => policyRoots.get(k) === pol);
           for(const r of rootsForPol) {
              if (roleDescendants.has(r)) {
                 validPolicies.push(pol);
                 break;
              }
           }
        }
        
        if (validPolicies.length === 1) {
           updates.push({ roleId, nodeId, opId, cond, policyId: validPolicies[0] });
        } else if (validPolicies.length > 1) {
           console.log(`Node ${nodeId} for Role ${roleId} is linked to multiple active policies structurally. Applying to the first one: ${validPolicies[0]}`);
           updates.push({ roleId, nodeId, opId, cond, policyId: validPolicies[0] });
        } else {
           updates.push({ roleId, nodeId, opId, cond, policyId: Array.from(assignedPolicies)[0] });
        }
      }
    }

    console.log(`Found ${updates.length} associations to update.`);
    let count = 0;
    
    // We create a RegExp from string to avoid escape issues in literals
    const regex = new RegExp("/\\\\*POL:.*?\\\\*/\\\\s*JSON_EXISTS\\\\(v_ctx,\\s*'\\\\$\\\\.contexto\\\\.politicas\\\\[\\\\*\\\\]\\\\?\\\\(@ == .*?\\\\)'\\\\)(?:\\\\s*(?:AND|OR)\\\\s*)?", "g");

    for (const u of updates) {
      let cleanCondition = (u.cond || '').replace(regex, '').trim();
      if (cleanCondition.startsWith('AND ')) cleanCondition = cleanCondition.substring(4).trim();
      
      const policyStr = `/*POL:${u.policyId}*/ JSON_EXISTS(v_ctx, '$.contexto.politicas[*]?(@ == "${u.policyId}" || @ == ${u.policyId})')`;
      
      const newCond = cleanCondition ? `${policyStr} AND (${cleanCondition})` : policyStr;
      
      await conn.execute(
        `UPDATE acc_asociaciones SET condicion_json = :newCond WHERE id_usr_attr = :roleId AND id_obj_attr = :nodeId AND id_op = :opId`,
        { newCond: newCond, roleId: u.roleId, nodeId: u.nodeId, opId: u.opId },
        { autoCommit: true }
      );
      count++;
    }
    console.log(`Successfully updated ${count} records.`);

  } catch(e) {
    console.error(e);
  } finally {
    if(conn) await conn.close();
  }
}
run();
