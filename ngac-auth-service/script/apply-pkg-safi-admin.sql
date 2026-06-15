SET DEFINE OFF;
SET SERVEROUTPUT ON;
SET FEEDBACK ON;
SET ECHO ON;
SET VERIFY OFF;
WHENEVER SQLERROR EXIT SQL.SQLCODE;

PROMPT === Compilando PACKAGE pkg_safi_admin ===
@/scripts/pkg-safi-admin-header.sql
SHOW ERRORS PACKAGE NGAC_USER.pkg_safi_admin;

PROMPT === Compilando PACKAGE BODY pkg_safi_admin ===
@/scripts/pkg-safi-admin-body.sql
SHOW ERRORS PACKAGE BODY NGAC_USER.pkg_safi_admin;

PROMPT === Estado final del objeto ===
SELECT object_name, object_type, status
FROM user_objects
WHERE object_name = 'PKG_SAFI_ADMIN'
ORDER BY object_type;

PROMPT === Fin de despliegue ===
exit;
