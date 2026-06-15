-- ==========================================
-- RESET LOG SEQUENCES
-- ==========================================

-- Excludes log data by not providing inserts for ACC_LOG_ACCESOS and ACC_LOG_ERRORES.
-- Restarts the sequences for logs at 1.

-- Note: Depending on Oracle version, restarting a sequence may require dropping and recreating it
-- or using ALTER SEQUENCE RESTART. Oracle 12c+ supports RESTART.

ALTER SEQUENCE SEQ_ACC_LOG_ACCESOS RESTART START WITH 1;
ALTER SEQUENCE SEQ_ACC_LOG_ERRORES RESTART START WITH 1;
