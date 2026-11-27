-- Aplicado en Supabase después de crear los cuatro roles con LOGIN.
-- Ejecutar una sola vez. Contraseñas administradas fuera del repositorio.
BEGIN;
GRANT CONNECT ON DATABASE postgres TO pablinho,gibran,cheche,sergio;
GRANT USAGE ON SCHEMA cinepollis TO pablinho,gibran,cheche,sergio;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA cinepollis TO pablinho,gibran,cheche,sergio;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA cinepollis TO pablinho,gibran,cheche,sergio;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cinepollis TO pablinho,gibran,cheche,sergio;
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='cinepollis' LOOP
    EXECUTE format(
      'CREATE POLICY cinepollis_team_data ON cinepollis.%I FOR ALL TO pablinho,gibran,cheche,sergio USING (true) WITH CHECK (true)',
      item.tablename
    );
  END LOOP;
END $$;
COMMIT;
