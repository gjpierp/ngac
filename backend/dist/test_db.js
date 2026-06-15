"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = require("./config/db.config");
async function test() {
    console.log('Connecting to database...');
    const conn = await (0, db_config_1.getDbConnection)();
    try {
        console.log('Querying compilation errors from user_errors...');
        const res = await conn.execute(`SELECT name, type, line, position, text 
       FROM user_errors 
       ORDER BY type, name, line`);
        console.log('Errors:', JSON.stringify(res.rows, null, 2));
    }
    catch (err) {
        console.error('Error:', err);
    }
    finally {
        await conn.close();
    }
}
test();
