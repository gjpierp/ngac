#!/usr/bin/env python3
"""load_excel_to_oracle.py

Script para cargar datos desde el Excel `NGACRol - Permisos - Opciones - v2.xlsx`
 directamente en la base de datos Oracle dentro del contenedor Docker.

Requisitos:
- pandas (`pip install pandas`)
- oracledb (`pip install oracledb`)
- openpyxl (para leer .xlsx con pandas)

Uso:
    python scripts/load_excel_to_oracle.py
"""
import os
import sys
import pandas as pd
import oracledb
from pathlib import Path
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s',
                    handlers=[logging.FileHandler('scripts/load_excel_report.txt'),
                              logging.StreamHandler(sys.stdout)])

# Ruta al archivo Excel (montado dentro del contenedor como /excel/...) 
EXCEL_PATH = os.getenv('EXCEL_PATH', '/excel/NGACRol - Permisos - Opciones - v2.xlsx')

# Parámetros de conexión Oracle (tomados del .env o variables de entorno)
DB_USER = os.getenv('DB_USER', 'NGAC_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'NGAC_PASSWORD')
DB_DSN = os.getenv('DB_CONNECTION_STRING', 'oracle-db:1521/XEPDB1')

# Mapeo hoja -> tabla y columnas clave
# Ajuste según la convención de tu esquema NGAC. Si la tabla tiene prefijo ACC_, se usa aquí.
SHEET_TABLE_MAP = {
    'CONTA': 'ACC_CONTA',
    'PRESP': 'ACC_PRESP',
    'VMNAC': 'ACC_VMNAC',
    'CONCI': 'ACC_CONCI',
    'CAJA': 'ACC_CAJA',
    'COMPR': 'ACC_COMPR',
    'DECRE': 'ACC_DECRE',
    'LIMED': 'ACC_LIMED',
    'DESCU': 'ACC_DESCU',
    'ALIME': 'ACC_ALIME',
    'VMEXT': 'ACC_VMEXT',
    'INFRA': 'ACC_INFRA',
    'COMEX': 'ACC_COMEX',
    'CONSO': 'ACC_CONSO',
    'ADMIN': 'ACC_ADMIN',
    'Tipos': 'ACC_TIPOS_NODO',
    'Roles': 'ACC_ROLES',
    'Politicas': 'ACC_POLITICAS',
    'Modulos': 'ACC_MODULOS',
    'Permisos': 'ACC_PERMISOS',
    'Divisiones': 'ACC_DIVISIONES',
}

def get_connection():
    try:
        con = oracledb.connect(user=DB_USER, password=DB_PASSWORD, dsn=DB_DSN)
        con.autocommit = False
        return con
    except oracledb.Error as e:
        logging.error(f"Error al conectar a Oracle: {e}")
        sys.exit(1)

def insert_dataframe(df: pd.DataFrame, table: str, cursor):
    """Inserta filas del DataFrame en la tabla indicada.
    Si la columna de ID está presente, se usa su valor; de lo contrario se
    utiliza la secuencia SEQ_<tabla>.
    """
    cols = df.columns.tolist()
    # Detectar columna de ID (convención: termina con _ID o ID)
    id_col = None
    for c in cols:
        if c.upper().endswith('_ID') or c.upper() == 'ID':
            id_col = c
            break

    for idx, row in df.iterrows():
        values = []
        placeholders = []
        for col in cols:
            if col == id_col and pd.isna(row[col]):
                # usar secuencia
                seq_name = f"SEQ_{table}"  # asume que la secuencia sigue este nombre
                placeholders.append(f"{seq_name}.NEXTVAL")
            else:
                placeholders.append("?")
                values.append(row[col])
        col_list = ", ".join(cols)
        ph_list = ", ".join(placeholders)
        sql = f"INSERT INTO {table} ({col_list}) VALUES ({ph_list})"
        try:
            if values:
                cursor.execute(sql, values)
            else:
                cursor.execute(sql)
            logging.info(f"Inserted row into {table}: {row.to_dict()}")
        except oracledb.Error as e:
            logging.error(f"Error inserting into {table}: {e} – Row: {row.to_dict()}")
            raise

def main():
    if not Path(EXCEL_PATH).exists():
        logging.error(f"Archivo Excel no encontrado en {EXCEL_PATH}")
        sys.exit(1)
    con = get_connection()
    cur = con.cursor()
    total_inserted = {}
    try:
        for sheet, table in SHEET_TABLE_MAP.items():
            try:
                df = pd.read_excel(EXCEL_PATH, sheet_name=sheet)
                if df.empty:
                    logging.info(f"Hoja {sheet} está vacía, se omite.")
                    continue
                insert_dataframe(df, table, cur)
                total_inserted[table] = len(df)
                con.commit()
            except Exception as e:
                logging.error(f"Fallo al procesar hoja {sheet}: {e}")
                con.rollback()
        # Actualizar secuencias al máximo ID insertado + 1
        for table, count in total_inserted.items():
            seq_name = f"SEQ_{table}"
            # obtener max id actual
            try:
                cur.execute(f"SELECT MAX(ID) FROM {table}")
                max_id = cur.fetchone()[0] or 0
                new_start = max_id + 1
                cur.execute(f"ALTER SEQUENCE {seq_name} RESTART START WITH {new_start}")
                logging.info(f"Secuencia {seq_name} reiniciada a {new_start}")
            except oracledb.Error as e:
                logging.warning(f"No se pudo ajustar secuencia {seq_name}: {e}")
        con.commit()
        logging.info(f"Carga completada. Filas insertadas por tabla: {total_inserted}")
    finally:
        cur.close()
        con.close()

if __name__ == "__main__":
    main()
