-- Metadatos obtenidos por el servidor desde TMDb para reconstruir las tarjetas.
BEGIN;
ALTER TABLE cinepollis.titles ADD COLUMN presentation jsonb NOT NULL DEFAULT '{}';
COMMIT;
