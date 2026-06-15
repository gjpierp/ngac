#!/usr/bin/env python
"""
Genera INSERTs reales para Oracle (excluyendo tablas de log) y los escribe
en database-backup/00-oracle/04-data-inserts.sql.
"""
import os
import pathlib
import sys
import datetime
import oracledb
# Load environment variables from .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# ------------------------------------------------------------
# 1️⃣ Cargar variables de entorno (usa defaults si no hay .env)
# ------------------------------------------------------------
DB_USER = os.getenv("DB_USER", "ngac_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "NGAC_PASSWORD")
DB_CONN_STR = os.getenv("DB_CONNECTION_STRING", "localhost:1522/XEPDB1")

if not (DB_USER and DB_PASSWORD and DB_CONN_STR):
    sys.stderr.write("❌ Faltan credenciales de conexión a Oracle\n")
    sys.exit(1)

# ------------------------------------------------------------
# 2️⃣ Conexión a Oracle
# ------------------------------------------------------------
try:
    oracledb.init_oracle_client()
except Exception:
    # En entornos donde el cliente ya está configurado, ignora el error
    pass

conn = oracledb.connect(user=DB_USER, password=DB_PASSWORD, dsn=DB_CONN_STR)
cur = conn.cursor()

# ------------------------------------------------------------
# 3️⃣ Tablas a procesar (excluye logs)
# ------------------------------------------------------------
EXCLUDE = {"ACC_LOG_ACCESOS", "ACC_LOG_ERRORES"}
cur.execute("SELECT table_name FROM user_tables WHERE table_name NOT IN (:1, :2) ORDER BY table_name", [list(EXCLUDE)[0], list(EXCLUDE)[1]])
tables = [row[0] for row in cur.fetchall()]

# ------------------------------------------------------------
# 4️⃣ Dependencias FK (topológico)
# ------------------------------------------------------------
from collections import defaultdict, deque
deps = defaultdict(set)
rev = defaultdict(set)
for tbl in tables:
    cur.execute(
        """
        SELECT a.column_name, c_pk.table_name
        FROM user_cons_columns a
        JOIN user_constraints c ON a.constraint_name = c.constraint_name
        JOIN user_constraints c_pk ON c.r_constraint_name = c_pk.constraint_name
        WHERE c.constraint_type = 'R' AND a.table_name = :tbl
        """,
        tbl=tbl,
    )
    for _, ref_tbl in cur.fetchall():
        deps[tbl].add(ref_tbl)
        rev[ref_tbl].add(tbl)

in_deg = {t: len(deps[t]) for t in tables}
queue = deque([t for t in tables if in_deg[t] == 0])
ordered = []
while queue:
    t = queue.popleft()
    ordered.append(t)
    for child in rev[t]:
        in_deg[child] -= 1
        if in_deg[child] == 0:
            queue.append(child)
if len(ordered) != len(tables):
    ordered = tables  # fallback

# ------------------------------------------------------------
# 5️⃣ Helper para literales SQL
# ------------------------------------------------------------
def sql_literal(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, bytes):
        return "HEXTORAW('" + v.hex() + "')"
    if isinstance(v, datetime.datetime):
        fmt = v.strftime("%Y-%m-%d %H:%M:%S")
        return f"TO_TIMESTAMP('{fmt}', 'YYYY-MM-DD HH24:MI:SS')"
    if isinstance(v, datetime.date):
        fmt = v.strftime("%Y-%m-%d")
        return f"TO_DATE('{fmt}', 'YYYY-MM-DD')"
    s = str(v).replace("'", "''")
    return f"'{s}'"

# ------------------------------------------------------------
# 6️⃣ Generar INSERTs
# ------------------------------------------------------------
out_path = pathlib.Path(r"C:\Local\safi-ngac\database-backup\00-oracle\04-data-inserts.sql")
with out_path.open("w", encoding="utf-8") as f:
    f.write("-- ==========================================\n")
    f.write("-- DATA INSERTS (GENERADO AUTOMÁTICAMENTE)\n")
    f.write("-- Excluye ACC_LOG_ACCESOS y ACC_LOG_ERRORES\n")
    f.write("-- ==========================================\n\n")
    for tbl in ordered:
        cur.execute(f"SELECT * FROM \"{tbl}\"")
        rows = cur.fetchall()
        if not rows:
            continue
        cols = [desc[0] for desc in cur.description]
        col_list = ", ".join(f'\"{c}\"' for c in cols)
        f.write(f"\n-- Insert into {tbl}\n")
        for row in rows:
            values = ", ".join(sql_literal(v) for v in row)
            f.write(f'INSERT INTO "{tbl}" ({col_list}) VALUES ({values});\n')
        f.write("COMMIT;\n")

print("INSERTs generados en", out_path)
