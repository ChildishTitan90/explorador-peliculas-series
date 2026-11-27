BEGIN;
SET LOCAL search_path = cinepollis, public;

ALTER TABLE users
  ALTER COLUMN google_sub DROP NOT NULL,
  ADD COLUMN email text,
  ADD COLUMN password_hash text,
  ADD COLUMN email_verified_at timestamptz,
  ADD CONSTRAINT email_trimmed CHECK (email IS NULL OR (email = btrim(email) AND length(email) BETWEEN 3 AND 254)),
  ADD CONSTRAINT local_credentials CHECK ((email IS NULL) = (password_hash IS NULL)),
  ADD CONSTRAINT account_identity CHECK (google_sub IS NOT NULL OR email IS NOT NULL),
  ADD CONSTRAINT hash_algorithm CHECK (password_hash IS NULL OR password_hash LIKE '$argon2id$%'),
  ADD CONSTRAINT verification_requires_email CHECK (email_verified_at IS NULL OR email IS NOT NULL);
CREATE UNIQUE INDEX users_email_unique ON users(lower(email));

CREATE FUNCTION clear_email_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF lower(NEW.email) IS DISTINCT FROM lower(OLD.email) THEN
   NEW.email_verified_at := NULL;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER users_change_email BEFORE UPDATE OF email ON users
FOR EACH ROW EXECUTE FUNCTION clear_email_verification();

CREATE TABLE login_sessions (
 token_hash bytea PRIMARY KEY CHECK (octet_length(token_hash)=32),
 user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
CREATE INDEX login_sessions_user ON login_sessions(user_id);
CREATE TABLE password_resets (
 token_hash bytea PRIMARY KEY CHECK (octet_length(token_hash)=32),
 user_id uuid NOT NULL UNIQUE REFERENCES users ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
COMMIT;
