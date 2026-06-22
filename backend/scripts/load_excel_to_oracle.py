#!/usr/bin/env python3
import os
import sys
import pandas as pd
import oracledb
from pathlib import Path
import logging

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler('/backup/load_excel_report.txt', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

EXCEL_PATH = os.getenv('EXCEL_PATH', '/excel/Dirtica/NGAC/Rol - Permisos - Opciones - v2.xlsx')
DB_USER = os.getenv('DB_USER', 'NGAC_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'G3rC4t_01_$$')
DB_DSN = os.getenv('DB_CONNECTION_STRING', 'oracle-db:1521/XEPDB1')

def slugify(text):
    import unicodedata
    import re
    if not text:
        return ""
    text = unicodedata.normalize('NFD', str(text)).encode('ascii', 'ignore').decode('utf-8')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def get_connection():
    try:
        # Usar modo Thin por defecto de oracledb (no requiere Instant Client)
        con = oracledb.connect(user=DB_USER, password=DB_PASSWORD, dsn=DB_DSN)
        con.autocommit = False
        return con
    except oracledb.Error as e:
        logging.error(f"Error al conectar a Oracle: {e}")
        sys.exit(1)

def main():
    if not Path(EXCEL_PATH).exists():
        logging.error(f"Archivo Excel no encontrado en {EXCEL_PATH}")
        sys.exit(1)
        
    logging.info(f"Iniciando carga de datos de acceso desde Excel: {EXCEL_PATH}")
    con = get_connection()
    cur = con.cursor()
    
    try:
        # 0. Semilla Inicial
        logging.info("Ejecutando inicializar_datos_semilla...")
        try:
            cur.execute("BEGIN pkg_safi_admin.inicializar_datos_semilla; END;")
            logging.info("Semilla inicializada correctamente.")
        except Exception as e:
            logging.warning(f"Advertencia al inicializar semilla: {e}")

        # 1. Operaciones (Permisos)
        logging.info("Cargando diccionario de operaciones...")
        df_perm = pd.read_excel(EXCEL_PATH, sheet_name='Permisos')
        for _, r in df_perm.iterrows():
            op = str(r.get('NOMBRE_OP', '')).strip().upper()
            desc = str(r.get('Descripción', r.get('Descripcion', op))).strip()
            if op:
                cur.execute("BEGIN pkg_seguridad_admin.p_upsert_operacion(:1, :2); END;", [op, desc])
        logging.info("Diccionario de operaciones cargado.")

        # 2. Tipos de Nodo (Estaticos + Dinamicos)
        logging.info("Cargando diccionario de tipos de nodo...")
        tipos_estaticos = [
            ('POLICY', 'Políticas de Acceso'),
            ('USR_ATTR', 'Atributos de Usuario (Roles)'),
            ('USUARIO', 'Usuarios del Sistema'),
            ('OBJ_ATTR', 'Atributos de Objeto'),
            ('OBJETO', 'Objetos/Recursos (Menú)')
        ]
        for c, d in tipos_estaticos:
            cur.execute("""
                INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion)
                SELECT :1, :2 FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = :1)
            """, [c, d])
            
        try:
            df_tipos = pd.read_excel(EXCEL_PATH, sheet_name='Tipos')
            for _, r in df_tipos.iterrows():
                codigo = str(r.get('CODIGO', r.get('Codigo', ''))).strip().upper()
                desc = str(r.get('DESCRIPCION', r.get('Descripcion', ''))).strip()
                if codigo:
                    cur.execute("""
                        INSERT INTO acc_tipos_nodo (codigo_tipo, descripcion)
                        SELECT :1, :2 FROM DUAL
                        WHERE NOT EXISTS (SELECT 1 FROM acc_tipos_nodo WHERE codigo_tipo = :1)
                    """, [codigo, desc])
        except Exception as e:
            logging.warning(f"No se pudo cargar hoja Tipos: {e}")

        # 3. Roles
        logging.info("Cargando diccionario de roles...")
        df_roles = pd.read_excel(EXCEL_PATH, sheet_name='Roles')
        for _, r in df_roles.iterrows():
            cod = str(r.get('CODIGO', '')).strip().upper()
            nom = str(r.get('NOMBRE', cod)).strip()
            if cod:
                cur.execute("""
                    BEGIN
                        pkg_seguridad_admin.p_upsert_nodo(:1, :2, 'USR_ATTR', NULL, NULL, 'groups', 0);
                    END;
                """, [cod, nom])
        logging.info("Diccionario de roles cargado.")

        # 4. Divisiones
        logging.info("Cargando diccionario de divisiones...")
        df_div = pd.read_excel(EXCEL_PATH, sheet_name='Divisiones')
        for _, r in df_div.iterrows():
            cod = str(r.get('CODIGO', r.get('Codigo', ''))).strip().upper()
            nom = str(r.get('NOMBRE', r.get('Nombre', cod))).strip()
            if cod:
                cur.execute("""
                    BEGIN
                        pkg_seguridad_admin.p_upsert_nodo(:1, :2, 'OBJ_ATTR', NULL, NULL, 'business', 0);
                    END;
                """, [cod, nom])
        logging.info("Diccionario de divisiones cargado.")

        # 5. Politicas
        logging.info("Cargando diccionario de politicas...")
        df_pol = pd.read_excel(EXCEL_PATH, sheet_name='Politicas')
        for _, r in df_pol.iterrows():
            cod = str(r.get('CODIGO_TECNICO', '')).strip().upper()
            etiq = str(r.get('DESCRIPCION', cod)).strip()
            if cod:
                cur.execute("""
                    BEGIN
                        pkg_seguridad_admin.p_upsert_nodo(:1, :2, 'POLICY', NULL, NULL, 'policy', 0);
                    END;
                """, [cod, etiq])
        logging.info("Diccionario de politicas cargado.")

        # 6. Modulos
        logging.info("Cargando modulos...")
        mapa_modulos = {}
        df_mod = pd.read_excel(EXCEL_PATH, sheet_name='Modulos')
        for _, m in df_mod.iterrows():
            mid = str(m.get('ID', m.get('Id', ''))).strip().rjust(2, '0')
            cod = str(m.get('Código', m.get('CÓDIGO', ''))).strip().upper()
            if cod:
                mapa_modulos[cod] = mid

        # 7. Hojas de Modulo (Jerarquia y Permisos)
        admin_sheets = ["ROLES", "MODULOS", "DIVISIONES", "PERMISOS", "ACCESOS", "LISTA", "ROLES-ACCESOS", "POLITICAS", "TIPOS"]
        xl = pd.ExcelFile(EXCEL_PATH)
        module_sheets = [s for s in xl.sheet_names if s.strip().upper() not in admin_sheets]
        
        # Obtener lista de roles cargados para homologacion
        cur.execute("SELECT codigo_tecnico FROM acc_nodos WHERE id_tipo_nodo = 2")
        roles_cargados = {row[0].strip().upper() for row in cur.fetchall()}
        
        for sheet_name in module_sheets:
            logging.info(f"Procesando hoja de modulo: {sheet_name}")
            df = pd.read_excel(EXCEL_PATH, sheet_name=sheet_name)
            df.columns = [str(c).strip() for c in df.columns]
            
            # Identificar columnas de roles
            col_roles = []
            for col in df.columns:
                norm_col = col.strip().upper()
                if norm_col in roles_cargados:
                    col_roles.append((col, norm_col))
                    
            # Mapeo de IDs de la hoja para buscar padres
            dict_ids = {}
            for _, row in df.iterrows():
                row_id = str(row.get('Id', row.get('ID', ''))).strip()
                cod_t = str(row.get('Codigo_Tecnico', row.get('CODIGO_TECNICO', ''))).strip().upper()
                if row_id and cod_t:
                    dict_ids[row_id] = cod_t
                    
            # Determinar nodos padre
            set_padres = set()
            for _, row in df.iterrows():
                id_padre = str(row.get('Codigo_Padre', row.get('Padre', ''))).strip()
                if id_padre and id_padre.lower() != 'null':
                    res = dict_ids.get(id_padre)
                    if not res and not id_padre.isdigit():
                        res = id_padre.upper()
                    if res:
                        set_padres.add(res)
                        
            # Guardar nodos y jerarquias
            order_tracker = {}
            for _, row in df.iterrows():
                cod_tecnico = str(row.get('Codigo_Tecnico', row.get('CODIGO_TECNICO', ''))).strip().upper()
                if not cod_tecnico or cod_tecnico == 'NULL':
                    continue
                    
                etiqueta = str(row.get('Etiqueta', row.get('Nombre', cod_tecnico))).strip()
                id_padre_raw = str(row.get('Codigo_Padre', row.get('Padre', ''))).strip()
                tipo = str(row.get('Tipo', 'OBJETO')).strip().upper()
                
                res_padre = dict_ids.get(id_padre_raw)
                if not res_padre and id_padre_raw and not id_padre_raw.isdigit():
                    res_padre = id_padre_raw.upper()
                    
                p_key = res_padre if res_padre else 'ROOT'
                orden = order_tracker.get(p_key, 0) + 1
                order_tracker[p_key] = orden
                
                url_man = str(row.get('Ruta', row.get('URL', row.get('Ruta_Web', '')))).strip()
                if url_man and url_man.lower() != 'null':
                    ruta_f = url_man
                else:
                    ruta_f = f"/{slugify(etiqueta)}" if tipo == 'OBJETO' else None
                    
                icono = str(row.get('Icono', 'label')).strip()
                
                # Upsert Nodo
                cur.execute("""
                    BEGIN
                        pkg_seguridad_admin.p_upsert_nodo(:1, :2, :3, :4, :5, :6, :7);
                    END;
                """, [cod_tecnico, etiqueta, tipo, ruta_f, slugify(etiqueta), icono, orden])
                
                # Enlazar con Padre
                if res_padre:
                    cur.execute("""
                        BEGIN
                            pkg_seguridad_admin.p_enlazar_nodos(:1, :2);
                        END;
                    """, [res_padre, cod_tecnico])
                    
                # Otorgar permisos
                is_consulta = any(x in etiqueta.upper() for x in ['CONSULTA', 'INFORME', 'REPORTE']) or (res_padre and any(x in res_padre.upper() for x in ['CONSULTA', 'INFORME', 'REPORTE']))
                is_operacion = any(x in etiqueta.upper() for x in ['PROCESO', 'OPERACION', 'MOVIMIENTO']) or (res_padre and any(x in res_padre.upper() for x in ['PROCESO', 'OPERACION', 'MOVIMIENTO']))
                
                if cod_tecnico not in set_padres and tipo == 'OBJETO':
                    for col_orig, norm_rol in col_roles:
                        val = str(row.get(col_orig, '')).strip().upper()
                        if val in ['*', 'X']:
                            ops = ['VER']
                            if is_consulta:
                                ops.extend(['IMPRIMIR', 'EXPORTAR'])
                            elif is_operacion:
                                ops.extend(['CREAR', 'EDITAR', 'ELIMINAR', 'REVISAR', 'APROBAR', 'RECHAZAR', 'ANULAR'])
                            else:
                                ops.extend(['CREAR', 'EDITAR', 'ELIMINAR'])
                                
                            for op in ops:
                                cur.execute("""
                                    BEGIN
                                        pkg_seguridad_admin.p_otorgar_permiso(:1, :2, :3);
                                    END;
                                """, [norm_rol, cod_tecnico, op])
                                
        # 8. Enlaces y permisos especiales al final
        logging.info("Aplicando configuraciones especiales de menu...")
        special_links = [
            ('PARAMETROS', 'PRESUPUESTO'),
            ('PARAMETROS_HOSP', 'PRESUPUESTO'),
            ('PARAMETROS_HOSP', 'PRESUPUESTO_HOSP')
        ]
        for parent, child in special_links:
            try:
                cur.execute("BEGIN pkg_seguridad_admin.p_enlazar_nodos(:1, :2); END;", [parent, child])
            except Exception as e:
                logging.warning(f"No se pudo crear enlace especial {parent} -> {child}: {e}")
                
        rol_jefe = 'ROL_JEFE_CONT'
        for node in ['PRESUPUESTO', 'PRESUPUESTO_HOSP']:
            for op in ['VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'APROBAR', 'RECHAZAR', 'ANULAR']:
                try:
                    cur.execute("BEGIN pkg_seguridad_admin.p_otorgar_permiso(:1, :2, :3); END;", [rol_jefe, node, op])
                except Exception as e:
                    logging.warning(f"No se pudo otorgar permiso especial a {rol_jefe} en {node} para {op}: {e}")

        # 9. Asignar Roles a Gerardo Paiva (gjpierp@gmail.com)
        logging.info("Asignando roles a Gerardo Paiva (gjpierp@gmail.com)...")
        cur.execute("SELECT id_usuario FROM safi_usuarios WHERE email = 'gjpierp@gmail.com'")
        usr_row = cur.fetchone()
        if usr_row:
            usr_id = usr_row[0]
            roles_to_assign = ['ROL_JEFE_CONT', 'ROL_JEFE_FIN', 'ROL_LOGIS']
            for r_code in roles_to_assign:
                cur.execute("SELECT id_nodo FROM acc_nodos WHERE codigo_tecnico = :1 AND id_tipo_nodo = 2", [r_code])
                r_row = cur.fetchone()
                if r_row:
                    r_id = r_row[0]
                    try:
                        cur.execute("BEGIN pkg_seguridad_admin.p_asignar_rol_a_usuario(:1, :2); END;", [usr_id, r_id])
                        logging.info(f"Rol {r_code} asignado al usuario ID {usr_id}")
                    except Exception as e:
                        logging.warning(f"No se pudo asignar rol {r_code} a usuario {usr_id}: {e}")
                else:
                    logging.warning(f"Rol {r_code} no encontrado en acc_nodos")
        else:
            logging.error("Usuario con email gjpierp@gmail.com no encontrado en safi_usuarios")
            
        con.commit()
        logging.info("¡Carga de base de datos desde Excel completada con éxito!")
        
    except Exception as e:
        con.rollback()
        logging.error(f"Fallo grave durante la carga de Excel: {e}")
        try:
            cur.execute(
                "INSERT INTO ACC_LOG_ERRORES (MODULO, MENSAJE) VALUES (:1, :2)",
                ("load_excel", str(e))
            )
            con.commit()
        except Exception:
            pass
        sys.exit(1)
    finally:
        cur.close()
        con.close()

if __name__ == "__main__":
    main()
