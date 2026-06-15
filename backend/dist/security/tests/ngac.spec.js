"use strict";
/**
 * @file        ngac.spec.ts
 * @description Pruebas unitarias para validar el motor de decisiones NGAC (GraphManager y AccessEvaluator).
 * @author      IA Assistant
 * @date        2026-06-09
 * @version     1.0.0
 * HISTORIAL DE CAMBIOS:
 * -----------------------------------------------------------------------------
 * FECHA        | AUTOR             | VERSIÓN   | DESCRIPCIÓN DEL CAMBIO
 * -----------------------------------------------------------------------------
 * 2026-06-09   | IA Assistant      | 1.0.0     | Creación inicial del archivo con test suite completo.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const NgacGraphManager_1 = require("../application/services/NgacGraphManager");
const AccessEvaluator_1 = require("../application/services/AccessEvaluator");
class MockNgacRepository {
    loggedEntries = [];
    async fetchNodes() {
        return [
            { idNode: 1, code: "USR_10", label: "Gerardo Paiva", typeId: 10, typeCode: "USUARIO", displayOrder: 0, active: true, slug: "gerardo" },
            { idNode: 2, code: "ROL_ADMIN", label: "Administrador", typeId: 20, typeCode: "USR_ATTR", displayOrder: 1, active: true },
            { idNode: 3, code: "ROL_MEDICO", label: "Médico Clinico", typeId: 20, typeCode: "USR_ATTR", displayOrder: 2, active: true },
            { idNode: 4, code: "UNI_URGENCIA", label: "Unidad Urgencia", typeId: 30, typeCode: "USR_ATTR", displayOrder: 3, active: true },
            { idNode: 5, code: "ENT_HOSPITAL", label: "Hospital Regional", typeId: 40, typeCode: "USR_ATTR", displayOrder: 4, active: true },
            { idNode: 6, code: "OA_HISTORIALES", label: "Atributo Historiales", typeId: 50, typeCode: "OBJ_ATTR", displayOrder: 5, active: true },
            { idNode: 7, code: "OBJ_FICHA_101", label: "Ficha Médica 101", typeId: 60, typeCode: "OBJETO", displayOrder: 6, active: true },
            { idNode: 8, code: "PC_SALUD", label: "Política de Salud", typeId: 70, typeCode: "POLICY", displayOrder: 7, active: true }
        ];
    }
    async fetchAssignments() {
        return [
            { parentId: 2, childId: 1 }, // ROL_ADMIN -> USR_10
            { parentId: 3, childId: 1 }, // ROL_MEDICO -> USR_10
            { parentId: 4, childId: 1 }, // UNI_URGENCIA -> USR_10
            { parentId: 5, childId: 1 }, // ENT_HOSPITAL -> USR_10
            { parentId: 6, childId: 7 }, // OA_HISTORIALES -> OBJ_FICHA_101
            { parentId: 8, childId: 6 }, // PC_SALUD -> OA_HISTORIALES (Politica -> Atributo)
            { parentId: 8, childId: 2 } // PC_SALUD -> ROL_ADMIN
        ];
    }
    async fetchAssociations() {
        return [
            { idAssociation: 101, userAttributeId: 3, objectAttributeId: 6, operationId: 1, operationName: "VER" }, // ROL_MEDICO -> OA_HISTORIALES (VER)
            { idAssociation: 102, userAttributeId: 2, objectAttributeId: 6, operationId: 2, operationName: "EDITAR", conditionJson: ":division == 'URGENCIA'" } // ROL_ADMIN -> OA_HISTORIALES (EDITAR con ABAC)
        ];
    }
    async fetchProhibitions() {
        return [
            { idProhibition: 201, userAttributeId: 4, objectAttributeId: 7, operationId: 3, operationName: "EDITAR" } // UNI_URGENCIA -> OBJ_FICHA_101 (Prohíbe EDITAR)
        ];
    }
    async fetchMenuNodes() {
        return [
            { idMenuNode: 1001, idNode: 6, code: "OA_HISTORIALES", label: "Menú Historiales", displayOrder: 1, active: true }
        ];
    }
    async fetchMenuAssignments() {
        return [];
    }
    async fetchPolicyMenuRoots() {
        return [
            { policyId: 8, menuNodeId: 1001 }
        ];
    }
    async fetchUserContext(username) {
        if (username === "gerardo") {
            return {
                userId: 10,
                email: "gerardo@safi.cl",
                active: true,
                entities: ["ENT_HOSPITAL"],
                units: ["UNI_URGENCIA"]
            };
        }
        return null;
    }
    async writeAccessLog(entry) {
        this.loggedEntries.push(entry);
    }
}
async function runTests() {
    console.log("=== INICIANDO PRUEBAS UNITARIAS NGAC EN NODE.JS ===");
    const mockRepo = new MockNgacRepository();
    const graph = NgacGraphManager_1.NgacGraphManager.getInstance();
    graph.setRepository(mockRepo);
    const evaluator = AccessEvaluator_1.AccessEvaluator.getInstance();
    evaluator.setRepository(mockRepo);
    // 1. Cargar el grafo y validar la inicialización
    await graph.refreshGraph();
    node_assert_1.default.strictEqual(graph.nodes.size, 8, "Deberían haberse cargado 8 nodos");
    console.log("✔ Carga e inicialización del grafo en memoria correcta.");
    // 2. Validar el cálculo de ancestros transitivos (DAG)
    // USR_10 (nodo 1) tiene padres: ROL_ADMIN (2), ROL_MEDICO (3), UNI_URGENCIA (4), ENT_HOSPITAL (5)
    // ROL_ADMIN (2) tiene padre: PC_SALUD (8)
    const userAncestors = graph.getAncestors(1);
    node_assert_1.default.ok(userAncestors.has(1), "Ancestros deben incluir al propio nodo");
    node_assert_1.default.ok(userAncestors.has(2), "Ancestros deben incluir ROL_ADMIN");
    node_assert_1.default.ok(userAncestors.has(3), "Ancestros deben incluir ROL_MEDICO");
    node_assert_1.default.ok(userAncestors.has(8), "Ancestros deben incluir PC_SALUD (herencia transitiva)");
    console.log("✔ Recorrido transitivo de ancestros (DAG) con herencia múltiple correcto.");
    // 3. Validar verificación de acceso (Caso 1: Asociación positiva simple)
    // Gerardo es ROL_MEDICO (3), que tiene permiso VER sobre OA_HISTORIALES (6), el cual es ancestro de OBJ_FICHA_101 (7)
    const hasAccessVer = await evaluator.checkAccess("gerardo", "OBJ_FICHA_101", "VER");
    node_assert_1.default.strictEqual(hasAccessVer, 1, "Debería otorgar acceso VER por asociación de ROL_MEDICO");
    console.log("✔ Evaluación de asociación de permisos positiva correcta.");
    // 4. Validar evaluación de condiciones contextuales (ABAC)
    // ROL_ADMIN (2) tiene permiso EDITAR sobre OA_HISTORIALES (6) si :division == 'URGENCIA'
    // El contexto inyecta la división del usuario ('URGENCIA' en mockUserContext)
    const hasAccessEditarOk = await evaluator.checkAccess("gerardo", "OBJ_FICHA_101", "EDITAR", { sujeto: { division: "URGENCIA" } });
    // Wait! Note that UNI_URGENCIA (4) has a PROHIBITION on EDITAR for OBJ_FICHA_101 (7).
    // So even though there is a positive association, the prohibition must prevail (Deny-Overrides)!
    // Let's test Deny-Overrides here:
    node_assert_1.default.strictEqual(hasAccessEditarOk, 0, "Debería denegar EDITAR debido a la prohibición en UNI_URGENCIA (Deny-Overrides)");
    console.log("✔ Aplicación estricta de prohibiciones (Deny-Overrides) correcta.");
    // 4.1. Probemos EDITAR con otro usuario que no tenga la prohibición de UNI_URGENCIA.
    // Mapeamos un contexto directo de atributos sin UNI_URGENCIA:
    const hasAccessEditarDirecto = await evaluator.verificarAcceso(["ROL_ADMIN", "ENT_HOSPITAL"], // Sin UNI_URGENCIA
    ["EDITAR"], "OBJ_FICHA_101", { sujeto: { division: "URGENCIA" } });
    node_assert_1.default.strictEqual(hasAccessEditarDirecto, 1, "Debería autorizar EDITAR si no tiene la prohibición y la condición ABAC se cumple");
    const hasAccessEditarCondFalla = await evaluator.verificarAcceso(["ROL_ADMIN", "ENT_HOSPITAL"], ["EDITAR"], "OBJ_FICHA_101", { sujeto: { division: "OTRA" } });
    node_assert_1.default.strictEqual(hasAccessEditarCondFalla, 0, "Debería denegar EDITAR si la condición ABAC de división no se cumple");
    console.log("✔ Evaluación dinámica de condiciones contextuales ABAC correcta.");
    // 5. Validar la generación de menús recursiva
    const menuResult = await evaluator.getMenuByContext(JSON.stringify({
        sujeto: { username: "gerardo", roles: ["ROL_MEDICO"] },
        contexto: { politicas: ["PC_SALUD"] },
        solicitud: { operaciones: ["VER"] }
    }));
    node_assert_1.default.ok(menuResult.menu, "El resultado debería contener el menú");
    node_assert_1.default.strictEqual(menuResult.menu.length, 1, "Debería retornar exactamente 1 menú raíz");
    node_assert_1.default.strictEqual(menuResult.menu[0].codigo, "OA_HISTORIALES", "El menú retornado debe ser el permitido");
    console.log("✔ Generación dinámica de menú jerárquico correcta.");
    console.log("\n=== TODAS LAS PRUEBAS SE COMPLETARON CON ÉXITO ===");
}
runTests().catch((err) => {
    console.error("❌ Falla en la ejecución de pruebas unitarias:", err);
    process.exit(1);
});
