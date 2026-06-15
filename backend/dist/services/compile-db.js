"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = require("../config/db.config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function run() {
    console.log('>>> RE-COMPILANDO PACKAGES EN ORACLE DB <<<');
    const connection = await (0, db_config_1.getDbConnection)();
    try {
        const scripts = [
            '../../../ngac-auth-service/script/pkg-safi-admin-header.sql',
            '../../../ngac-auth-service/script/pkg-safi-admin-body.sql',
            '../../../ngac-auth-service/script/pkg-seguridad-admin-header.sql',
            '../../../ngac-auth-service/script/pkg-seguridad-admin-body.sql'
        ];
        for (const relativePath of scripts) {
            const fullPath = path.resolve(__dirname, relativePath);
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.trim();
            if (content.endsWith('/')) {
                content = content.substring(0, content.length - 1).trim();
            }
            console.log(`Compilando: ${path.basename(relativePath)}...`);
            await connection.execute(content);
            console.log(`✅ Compilado con éxito: ${path.basename(relativePath)}`);
        }
        console.log('>>> RE-COMPILACIÓN DE PACKAGES COMPLETADA CON ÉXITO <<<');
    }
    catch (err) {
        console.error('❌ Error durante la compilación:', err);
        process.exit(1);
    }
    finally {
        await connection.close();
    }
}
run();
