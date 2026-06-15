"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbConnection = void 0;
const oracledb_1 = __importDefault(require("oracledb"));
const dotenv_1 = __importDefault(require("dotenv"));
const NgacGraphManager_1 = require("../security/application/services/NgacGraphManager");
dotenv_1.default.config();
const getDbConnection = async () => {
    try {
        const conn = await oracledb_1.default.getConnection({
            user: process.env.DB_USER || 'ngac_user',
            password: process.env.DB_PASSWORD || 'G3rC4t_01',
            connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/XEPDB1'
        });
        let isModified = false;
        const handler = {
            get(target, prop) {
                const origMethod = target[prop];
                if (typeof origMethod === 'function') {
                    if (prop === 'execute') {
                        return async function (sql, bindParams = {}, options = {}) {
                            const sqlUpper = String(sql || '').trim().toUpperCase();
                            if (sqlUpper.includes('INSERT') ||
                                sqlUpper.includes('UPDATE') ||
                                sqlUpper.includes('DELETE') ||
                                sqlUpper.includes('MERGE') ||
                                sqlUpper.includes('PKG_SEGURIDAD_ADMIN') ||
                                sqlUpper.includes('PKG_SAFI_ADMIN')) {
                                isModified = true;
                            }
                            const res = await origMethod.apply(target, arguments);
                            if (isModified && (options.autoCommit || options.autoCommit === undefined)) {
                                NgacGraphManager_1.NgacGraphManager.getInstance().refreshGraph().catch(err => {
                                    console.error('[DB Proxy] Error refreshing graph after autocommit:', err);
                                });
                                isModified = false;
                            }
                            return res;
                        };
                    }
                    if (prop === 'commit') {
                        return async function () {
                            const res = await origMethod.apply(target, arguments);
                            if (isModified) {
                                NgacGraphManager_1.NgacGraphManager.getInstance().refreshGraph().catch(err => {
                                    console.error('[DB Proxy] Error refreshing graph after commit:', err);
                                });
                                isModified = false;
                            }
                            return res;
                        };
                    }
                    return origMethod.bind(target);
                }
                return origMethod;
            }
        };
        return new Proxy(conn, handler);
    }
    catch (err) {
        console.error('[DB] Error conectando a Oracle DB', err);
        throw err;
    }
};
exports.getDbConnection = getDbConnection;
