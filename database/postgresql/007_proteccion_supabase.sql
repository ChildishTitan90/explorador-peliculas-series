-- Protección aplicada en Supabase al instalar el esquema privado del servidor.
BEGIN;
ALTER TABLE cinepollis.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.activity_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.movie_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.shared_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.passed_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinepollis.password_resets ENABLE ROW LEVEL SECURITY;
COMMIT;
