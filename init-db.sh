#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# init-db.sh — Inicializador Maestro del Ecosistema SAFI-NGAC
# ─────────────────────────────────────────────────────────────────
set -e

DB_USER=${DB_USER:-ngac_user}
DB_PASSWORD=${DB_PASSWORD:-G3rC4t_01}
DB_CONNECTION_STRING=${DB_CONNECTION_STRING:-localhost:1521/XEPDB1}

# Función para ejecutar un script SQL
run_sql() {
    local script_path=$1
    if [ -f "$script_path" ]; then
        echo "--- Ejecutando: $script_path"
        echo exit | sqlplus -S "$DB_USER/$DB_PASSWORD@$DB_CONNECTION_STRING" "@$script_path"
    else
        echo "!!! Saltando (no existe): $script_path"
    fi
}

echo "=== INICIANDO CARGA DE BASE DE DATOS NGAC ==="

# 1. Estructura base
run_sql "/scripts/script-ngac.sql"

# 2. Paquetes (Headers)
run_sql "/scripts/pkg-seguridad-ngac-header.sql"
run_sql "/scripts/pkg-seguridad-admin-header.sql"

# 2. Paquetes (Bodies)
run_sql "/scripts/pkg-seguridad-ngac-body.sql"
run_sql "/scripts/pkg-seguridad-admin-body.sql"

# 3. Datos de Accesos (Orden numérico por carpetas 00-14)
echo "--- Procesando Accesos_Paquete..."
for script in /scripts/Accesos_Paquete/*/*.sql; do
    [ -e "$script" ] || continue
    run_sql "$script"
done

# 4. Políticas finales
run_sql "/scripts/script-politicas.sql"

echo "=== CARGA COMPLETADA EXITOSAMENTE ==="
