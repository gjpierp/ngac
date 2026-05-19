import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

export const getDbConnection = async (): Promise<oracledb.Connection> => {
    try {
        return await oracledb.getConnection({
            user: process.env.DB_USER || 'ngac_user',
            password: process.env.DB_PASSWORD || 'G3rC4t_01',
            connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/XEPDB1'
        });
    } catch (err) {
        console.error('[DB] Error conectando a Oracle DB', err);
        throw err;
    }
};
