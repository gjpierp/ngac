import oracledb from 'oracledb';
import dotenv from 'dotenv';
import { NgacGraphManager } from '../security/application/services/NgacGraphManager';

dotenv.config();

export const getDbConnection = async (): Promise<oracledb.Connection> => {
    try {
        const conn = await oracledb.getConnection({
            user: process.env.DB_USER || 'ngac_user',
            password: process.env.DB_PASSWORD || 'G3rC4t_01',
            connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/XEPDB1'
        });

        let isModified = false;

        const handler: ProxyHandler<oracledb.Connection> = {
            get(target: any, prop: string | symbol) {
                const origMethod = target[prop];
                if (typeof origMethod === 'function') {
                    if (prop === 'execute') {
                        return async function (this: any, sql: string, bindParams: any = {}, options: any = {}) {
                            const sqlUpper = String(sql || '').trim().toUpperCase();
                            if (
                                sqlUpper.includes('INSERT') ||
                                sqlUpper.includes('UPDATE') ||
                                sqlUpper.includes('DELETE') ||
                                sqlUpper.includes('MERGE') ||
                                sqlUpper.includes('PKG_SEGURIDAD_ADMIN') ||
                                sqlUpper.includes('PKG_SAFI_ADMIN')
                            ) {
                                isModified = true;
                            }
                            const res = await origMethod.apply(target, arguments);
                            if (isModified && (options.autoCommit || options.autoCommit === undefined)) {
                                NgacGraphManager.getInstance().refreshGraph().catch(err => {
                                    console.error('[DB Proxy] Error refreshing graph after autocommit:', err);
                                });
                                isModified = false;
                            }
                            return res;
                        };
                    }
                    if (prop === 'commit') {
                        return async function (this: any) {
                            const res = await origMethod.apply(target, arguments);
                            if (isModified) {
                                NgacGraphManager.getInstance().refreshGraph().catch(err => {
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
    } catch (err) {
        console.error('[DB] Error conectando a Oracle DB', err);
        throw err;
    }
};
