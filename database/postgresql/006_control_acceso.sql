-- Aplicar una vez después de 005_acceso_correo.sql.
-- Estas funciones se invocan exclusivamente desde el servidor.
BEGIN;
SET LOCAL search_path = cinepollis, public;

ALTER TABLE users
  ADD COLUMN failed_login_attempts integer NOT NULL DEFAULT 0
    CHECK (failed_login_attempts BETWEEN 0 AND 5),
  ADD COLUMN login_blocked_until timestamptz;

ALTER TABLE login_sessions
  ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD CONSTRAINT one_session_per_user UNIQUE (user_id);
-- Si existen varias sesiones por cuenta, la migración se revierte.
-- Antes de repetirla, el servidor debe cerrar esas sesiones.

CREATE FUNCTION cinepollis.register_login_failure(p_user_id uuid)
RETURNS timestamptz LANGUAGE plpgsql
SET search_path = cinepollis, pg_temp AS $$
DECLARE
  account users;
  checked_at timestamptz;
  attempts integer;
  blocked_until timestamptz;
BEGIN
  SELECT * INTO STRICT account FROM users WHERE id = p_user_id FOR UPDATE;
  checked_at := clock_timestamp();
  IF account.login_blocked_until > checked_at THEN
    RETURN account.login_blocked_until;
  END IF;
  attempts := CASE WHEN account.login_blocked_until IS NOT NULL
    THEN 1 ELSE account.failed_login_attempts + 1 END;
  IF attempts >= 5 THEN
    blocked_until := checked_at + interval '15 minutes';
  END IF;
  UPDATE users
    SET failed_login_attempts = attempts, login_blocked_until = blocked_until
    WHERE id = p_user_id;
  RETURN blocked_until;
END;
$$;

-- Llamar únicamente después de verificar la contraseña en el servidor.
CREATE FUNCTION cinepollis.start_login_session(
  p_user_id uuid, p_token_hash bytea, p_expires_at timestamptz
)
RETURNS TABLE (outcome text, retry_at timestamptz) LANGUAGE plpgsql
SET search_path = cinepollis, pg_temp AS $$
DECLARE
  account users;
  previous_session login_sessions;
  checked_at timestamptz;
BEGIN
  SELECT * INTO STRICT account FROM users WHERE id = p_user_id FOR UPDATE;
  checked_at := clock_timestamp();
  IF account.login_blocked_until > checked_at THEN
    RETURN QUERY SELECT 'blocked'::text, account.login_blocked_until;
    RETURN;
  END IF;
  IF p_token_hash IS NULL OR octet_length(p_token_hash) <> 32
    OR p_expires_at IS NULL OR p_expires_at <= checked_at THEN
    RAISE EXCEPTION 'Token o vencimiento de sesión inválido';
  END IF;
  -- La contraseña correcta reinicia el contador, incluso si hay otra sesión.
  UPDATE users SET failed_login_attempts = 0, login_blocked_until = NULL
    WHERE id = p_user_id;
  SELECT * INTO previous_session FROM login_sessions WHERE user_id = p_user_id;
  IF previous_session.expires_at > checked_at
    AND previous_session.last_seen_at > checked_at - interval '5 minutes' THEN
    RETURN QUERY SELECT 'session_active'::text, NULL::timestamptz;
    RETURN;
  END IF;
  DELETE FROM login_sessions WHERE user_id = p_user_id;
  INSERT INTO login_sessions(token_hash, user_id, expires_at, last_seen_at)
    VALUES(p_token_hash, p_user_id, p_expires_at, checked_at);
  RETURN QUERY SELECT 'created'::text, NULL::timestamptz;
END;
$$;

-- Validar cada petición protegida usando el digest del token de su cookie.
CREATE FUNCTION cinepollis.touch_login_session(p_token_hash bytea)
RETURNS uuid LANGUAGE plpgsql
SET search_path = cinepollis, pg_temp AS $$
DECLARE
  session_account_id uuid;
  checked_at timestamptz;
BEGIN
  SELECT user_id INTO session_account_id FROM login_sessions WHERE token_hash = p_token_hash;
  IF session_account_id IS NULL THEN RETURN NULL; END IF;
  -- Mismo bloqueo que usa el inicio de sesión para resolver accesos simultáneos.
  PERFORM 1 FROM users WHERE id = session_account_id FOR UPDATE;
  checked_at := clock_timestamp();
  UPDATE login_sessions SET last_seen_at = checked_at
    WHERE token_hash = p_token_hash AND expires_at > checked_at
    RETURNING user_id INTO session_account_id;
  RETURN session_account_id;
END;
$$;

REVOKE ALL ON FUNCTION cinepollis.register_login_failure(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION cinepollis.start_login_session(uuid, bytea, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION cinepollis.touch_login_session(bytea) FROM PUBLIC;
COMMIT;
