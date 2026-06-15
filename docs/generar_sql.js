const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const ARCHIVO_EXCEL = "Rol - Permisos - Opciones - v2.xlsx";
const BASE_SALIDA = "Accesos_Paquete";
const TAMANO_BLOQUE = 500;

const asegurarCarpeta = (ruta) => {
    if (!fs.existsSync(ruta)) fs.mkdirSync(ruta, { recursive: true });
};

const normalizar = (txt) => String(txt || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const slugify = (text) => String(text || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const generarRutaWeb = (text) => '/' + slugify(text);

try {
    console.log(`🚀 Iniciando generación completa (Global + Módulos)...`);
    const workbook = xlsx.readFile(ARCHIVO_EXCEL);
    asegurarCarpeta(BASE_SALIDA);
    const globalDir = path.join(BASE_SALIDA, "00_GLOBAL");
    asegurarCarpeta(globalDir);

    const mapaModulos = new Map();
    const homologacionRoles = new Map(); 

    // --- 1. FASE GLOBAL ---

    // 01. Operaciones
    const hPermisos = workbook.SheetNames.find(n => normalizar(n) === "PERMISOS");
    if (hPermisos) {
        let sql = `BEGIN\n`;
        xlsx.utils.sheet_to_json(workbook.Sheets[hPermisos]).forEach(r => {
            const op = String(r.NOMBRE_OP || "").trim().toUpperCase();
            const desc = String(r.Descripción || r.Descripcion || op).trim();
            if (op) sql += `    pkg_seguridad_admin.p_upsert_operacion('${op}', '${desc.replace(/'/g, "''")}');\n`;
        });
        sql += `    COMMIT;\nEND;`;
        fs.writeFileSync(path.join(globalDir, "01_DICCIONARIO_OPERACIONES.sql"), sql);
    }

    // 02. Tipos de Nodo (Estático)
    let sqlTipos = `BEGIN\n`;
    const tipos = [
        {c: 'POLICY', d: 'Políticas de Acceso'},
        {c: 'USR_ATTR', d: 'Atributos de Usuario (Roles)'},
        {c: 'USUARIO', d: 'Usuarios del Sistema'},
        {c: 'OBJ_ATTR', d: 'Atributos de Objeto'},
        {c: 'OBJETO', d: 'Objetos/Recursos (Menú)'}
    ];
    tipos.forEach(t => {
        sqlTipos += `    INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion) SELECT '${t.c}', '${t.d}' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = '${t.c}');\n`;
    });
    sqlTipos += `    COMMIT;\nEND;`;
    fs.writeFileSync(path.join(globalDir, "02_DICCIONARIO_TIPOS_NODO.sql"), sqlTipos);
    // --- Dynamic TIPOS sheet processing ---
    const hTipos = workbook.SheetNames.find(n => normalizar(n) === "TIPOS");
    if (hTipos) {
        let sqlDynamic = `BEGIN\n`;
        xlsx.utils.sheet_to_json(workbook.Sheets[hTipos]).forEach(r => {
            const codigo = String(r.CODIGO || r.Codigo || r.codigo || "").trim().toUpperCase();
            const desc = String(r.DESCRIPCION || r.Descripcion || r.descripcion || "").trim();
            if (codigo) {
                sqlDynamic += `    INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion) SELECT '${codigo}', '${desc.replace(/'/g, "''")}' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = '${codigo}');\n`;
            }
        });
        sqlDynamic += `    COMMIT;\nEND;`;
        fs.writeFileSync(path.join(globalDir, "02_DICCIONARIO_TIPOS_NODO_DYNAMIC.sql"), sqlDynamic);
    }

    // 03. Roles


    // 04. Divisiones
    const hDiv = workbook.SheetNames.find(n => normalizar(n) === "DIVISIONES");
    if (hDiv) {
        let sql = `BEGIN\n`;
        xlsx.utils.sheet_to_json(workbook.Sheets[hDiv]).forEach(r => {
            const cod = String(r.CODIGO || r.Codigo || "").trim().toUpperCase();
            const nom = String(r.NOMBRE || r.Nombre || cod).trim();
            if (cod) sql += `    pkg_seguridad_admin.p_upsert_nodo('${cod}', '${nom.replace(/'/g, "''")}', 'OBJ_ATTR', NULL, NULL, 'business', 0);\n`;
        });
        sql += `    COMMIT;\nEND;`;
        fs.writeFileSync(path.join(globalDir, "04_DICCIONARIO_DIVISIONES.sql"), sql);
    }

    // 05. Políticas
    const hPol = workbook.SheetNames.find(n => normalizar(n) === "POLITICAS");
    if (hPol) {
        let sql = `BEGIN\n`;
        xlsx.utils.sheet_to_json(workbook.Sheets[hPol]).forEach(r => {
            const kCod = Object.keys(r).find(k => /COD|TECNICO/i.test(normalizar(k)));
            const kEti = Object.keys(r).find(k => /ETI|NOM|DESC/i.test(normalizar(k)));
            const cod = kCod ? String(r[kCod]).trim().toUpperCase() : null;
            const etiq = kEti ? String(r[kEti]).trim() : cod;
            if (cod) sql += `    pkg_seguridad_admin.p_upsert_nodo('${cod}', '${etiq.replace(/'/g, "''")}', 'POLICY', NULL, NULL, 'policy', 0);\n`;
        });
        sql += `    COMMIT;\nEND;`;
        fs.writeFileSync(path.join(globalDir, "05_DICCIONARIO_POLITICAS.sql"), sql);
    }

    // --- 2. FASE MODULAR ---
    const hMod = workbook.SheetNames.find(n => normalizar(n) === "MODULOS");
    if (hMod) {
        xlsx.utils.sheet_to_json(workbook.Sheets[hMod]).forEach(m => {
            const id = String(m.ID || m.Id || "").trim().padStart(2, '0');
            const cod = String(m.Código || m.CÓDIGO || "").trim().toUpperCase();
            if (cod) mapaModulos.set(cod, id);
        });
    }

    const adminSheets = ["ROLES", "MODULOS", "DIVISIONES", "PERMISOS", "ACCESOS", "LISTA", "ROLES-ACCESOS", "POLITICAS", "TIPOS"];
    
    workbook.SheetNames.filter(h => !adminSheets.includes(normalizar(h))).forEach(nombreHoja => {
        const codModExcel = nombreHoja.trim().toUpperCase();
        const idMod = mapaModulos.get(codModExcel) || "99";
        const moduloDir = path.join(BASE_SALIDA, `${idMod}_${codModExcel}`);
        asegurarCarpeta(moduloDir);

        const data = xlsx.utils.sheet_to_json(workbook.Sheets[nombreHoja], { defval: "" });
        const headers = xlsx.utils.sheet_to_json(workbook.Sheets[nombreHoja], { header: 1 })[0] || [];
        const colRolesActivas = headers.map((h, i) => ({ original: h, norm: normalizar(h) }))
                                       .filter(h => homologacionRoles.has(h.norm));

        const dictIds = new Map();
        const setPadres = new Set();
        data.forEach(row => {
            const idF = String(row.ID || row.Id || "").trim();
            const codT = String(row.Codigo_Tecnico || row.CODIGO_TECNICO || "").trim().toUpperCase();
            if (idF && codT) dictIds.set(idF, codT);
        });
        data.forEach(row => {
            const idPadre = String(row.Codigo_Padre || row.Padre || "").trim();
            if (idPadre !== "" && idPadre !== "null") {
                const res = dictIds.get(idPadre) || (isNaN(idPadre) ? idPadre.toUpperCase() : null);
                if (res) setPadres.add(res);
            }
        });

        const lineasNodos = [];
        const lineasJerarq = [];
        const permisosPorRol = new Map();
        const orderTracker = new Map();

        data.forEach(row => {
            const codTecnico = String(row.Codigo_Tecnico || row.CODIGO_TECNICO || "").trim().toUpperCase();
            if (!codTecnico || codTecnico === "NULL") return;

            const etiqueta = String(row.Etiqueta || row.Nombre || codTecnico).trim();
            const idPadre = String(row.Codigo_Padre || row.Padre || "").trim();
            const tipo = String(row.Tipo || 'OBJETO').toUpperCase();
            const resPadre = dictIds.get(idPadre) || (isNaN(idPadre) && idPadre !== "" ? idPadre.toUpperCase() : null);

            const esCons = /CONSULTA|INFORME|REPORTE/i.test(etiqueta) || (resPadre && /CONSULTA|INFORME|REPORTE/i.test(resPadre));
            const esOper = /PROCESO|OPERACION|MOVIMIENTO/i.test(etiqueta) || (resPadre && /PROCESO|OPERACION|MOVIMIENTO/i.test(resPadre));

            const pKey = resPadre || "ROOT";
            let nOrden = (orderTracker.get(pKey) || 0) + 1;
            orderTracker.set(pKey, nOrden);

            let urlMan = String(row.Ruta || row.URL || row.Ruta_Web || "").trim();
            let rutaF = (urlMan && urlMan !== "null") ? `'${urlMan}'` : (tipo === 'OBJETO' ? `'${generarRutaWeb(etiqueta)}'` : "NULL");

            lineasNodos.push(`pkg_seguridad_admin.p_upsert_nodo('${codTecnico}', '${etiqueta.replace(/'/g, "''")}', '${tipo}', ${rutaF}, '${slugify(etiqueta)}', '${row.Icono || 'label'}', ${nOrden});`);
            if (resPadre) lineasJerarq.push(`pkg_seguridad_admin.p_enlazar_nodos('${resPadre}', '${codTecnico}');`);

            if (!setPadres.has(codTecnico) && tipo === 'OBJETO') {
                colRolesActivas.forEach(col => {
                    const val = String(row[col.original]).trim().toUpperCase();
                    if (val === "*" || val === "X") {
                        const nRol = homologacionRoles.get(col.norm);
                        if (!permisosPorRol.has(nRol)) permisosPorRol.set(nRol, []);
                        let ops = ['VER'];
                        if (esCons) ops.push('IMPRIMIR', 'EXPORTAR');
                        else if (esOper) ops.push('CREAR', 'EDITAR', 'ELIMINAR', 'REVISAR', 'APROBAR', 'RECHAZAR', 'ANULAR');
                        else ops.push('CREAR', 'EDITAR', 'ELIMINAR');

                        ops.forEach(op => permisosPorRol.get(nRol).push(`pkg_seguridad_admin.p_otorgar_permiso('${nRol}', '${codTecnico}', '${op}');`));
                    }
                });
            }
        });

        const genBloque = (lista) => {
            let s = "";
            for (let i = 0; i < lista.length; i += TAMANO_BLOQUE) {
                s += `BEGIN\n` + lista.slice(i, i + TAMANO_BLOQUE).map(l => `    ${l}`).join('\n') + `\n    COMMIT;\nEND;\n\n`;
            }
            return s;
        };

        fs.writeFileSync(path.join(moduloDir, `03_NODOS_${codModExcel}.sql`), genBloque(lineasNodos));
        fs.writeFileSync(path.join(moduloDir, `04_JERARQUIAS_${codModExcel}.sql`), genBloque(lineasJerarq));

        let sqlPermisos = "";
// Multi-parent linking for specific nodes
const specialLinks = [
    {parent: 'PARAMETROS', child: 'PRESUPUESTO'},
    {parent: 'PARAMETROS_HOSP', child: 'PRESUPUESTO'},
    {parent: 'PARAMETROS_HOSP', child: 'PRESUPUESTO_HOSP'}
];
specialLinks.forEach(l => {
    lineasJerarq.push(`pkg_seguridad_admin.p_enlazar_nodos('${l.parent}', '${l.child}');`);
});
// Permissions for ROL_JEFE_CONT on PRESUPUESTO and PRESUPUESTO_HOSP
const rolJefe = 'ROL_JEFE_CONT';
if (!permisosPorRol.has(rolJefe)) permisosPorRol.set(rolJefe, []);
['PRESUPUESTO','PRESUPUESTO_HOSP'].forEach(node => {
    ['VER','CREAR','EDITAR','ELIMINAR','APROBAR','RECHAZAR','ANULAR'].forEach(op => {
        permisosPorRol.get(rolJefe).push(`pkg_seguridad_admin.p_otorgar_permiso('${rolJefe}', '${node}', '${op}');`);
    });
});
        Array.from(permisosPorRol.keys()).sort().forEach(rol => {
            sqlPermisos += `BEGIN\n` + permisosPorRol.get(rol).map(l => `    ${l}`).join('\n') + `\n    COMMIT;\nEND;\n\n`;
        });
        fs.writeFileSync(path.join(moduloDir, `05_PERMISOS_${codModExcel}.sql`), sqlPermisos);
    });

    console.log("✅ Proceso terminado. Archivos globales y modulares generados.");
} catch (e) { console.error("❌ ERROR:", e.message); }