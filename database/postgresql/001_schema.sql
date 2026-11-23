-- PostgreSQL 15+; ejecutar UNA VEZ sobre una base vacía con ON_ERROR_STOP=1.
BEGIN;
CREATE SCHEMA cinepollis;
SET search_path = cinepollis, public;
CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 google_sub text NOT NULL UNIQUE,
 username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,24}$'),
 display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 60),
 avatar_url text,
 bio text NOT NULL DEFAULT '' CHECK (length(bio)<=240),
 created_at timestamptz NOT NULL DEFAULT now()
);
-- Correo y tokens OAuth no se publican ni se guardan en las proyecciones.
CREATE TABLE follows (
 follower_id uuid REFERENCES users ON DELETE CASCADE,
 followed_id uuid REFERENCES users ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(follower_id,followed_id), CHECK(follower_id<>followed_id)
);
CREATE INDEX follows_followed ON follows(followed_id,follower_id);
CREATE TABLE titles (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 kind text NOT NULL CHECK(kind IN ('movie','tv','episode')),
 tmdb_id bigint NOT NULL CHECK(tmdb_id>0),
 title text NOT NULL, poster_path text, backdrop_path text,
 series_tmdb_id bigint, season_number integer, episode_number integer,
 UNIQUE(kind,tmdb_id),
 CHECK ((kind='episode' AND series_tmdb_id IS NOT NULL AND season_number IS NOT NULL AND episode_number IS NOT NULL AND series_tmdb_id>0 AND season_number>=0 AND episode_number>0)
 OR (kind IN ('movie','tv') AND series_tmdb_id IS NULL AND season_number IS NULL AND episode_number IS NULL))
);
CREATE UNIQUE INDEX unique_episode_position ON titles(series_tmdb_id,season_number,episode_number) WHERE kind='episode';
CREATE TABLE entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 title_id bigint NOT NULL REFERENCES titles ON DELETE RESTRICT,
 favorite boolean NOT NULL DEFAULT false,
 watchlist boolean NOT NULL DEFAULT false,
 watched_at timestamptz,
 score numeric(2,1) CHECK(score BETWEEN 0 AND 5 AND mod(score*2,1)=0),
 review text NOT NULL DEFAULT '' CHECK(length(review)<=4000),
 spoiler boolean NOT NULL DEFAULT false,
 first_rated_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,title_id),
 CHECK(score IS NULL OR (watched_at IS NOT NULL AND first_rated_at IS NOT NULL)),
 CHECK(score IS NOT NULL OR review='')
);
CREATE INDEX entries_profile ON entries(user_id,watched_at DESC);
CREATE INDEX entries_title_ratings ON entries(title_id,first_rated_at DESC) WHERE score IS NOT NULL;
CREATE TABLE activity_outbox (
 version bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 entry_id uuid NOT NULL,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 processed_at timestamptz
);
CREATE INDEX pending_outbox ON activity_outbox(version) WHERE processed_at IS NULL;
CREATE FUNCTION prepare_entry() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE k text;
BEGIN
 SELECT kind INTO k FROM cinepollis.titles WHERE id=NEW.title_id;
 IF NEW.score IS NOT NULL AND k='tv' THEN
  RAISE EXCEPTION 'Las series se califican a través de sus episodios';
 END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.id<>OLD.id OR NEW.user_id<>OLD.user_id OR NEW.title_id<>OLD.title_id THEN
   RAISE EXCEPTION 'La identidad de la entrada es inmutable';
  END IF;
  NEW.first_rated_at := OLD.first_rated_at;
 END IF;
 IF NEW.score IS NOT NULL THEN
  NEW.first_rated_at := COALESCE(NEW.first_rated_at,now());
  NEW.watched_at := COALESCE(NEW.watched_at,now());
  NEW.watchlist := false;
 ELSE
  NEW.review := ''; NEW.spoiler := false;
 END IF;
 NEW.updated_at := now();
 RETURN NEW;
END $$;
CREATE TRIGGER entries_prepare BEFORE INSERT OR UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION prepare_entry();
CREATE FUNCTION publish_entry() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e cinepollis.entries; u cinepollis.users; t cinepollis.titles;
BEGIN
 IF TG_OP='DELETE' THEN e:=OLD; ELSE e:=NEW; END IF;
 SELECT * INTO u FROM cinepollis.users WHERE id=e.user_id;
 SELECT * INTO t FROM cinepollis.titles WHERE id=e.title_id;
 INSERT INTO cinepollis.activity_outbox(entry_id,payload) VALUES(e.id,
 jsonb_build_object('entryId',e.id,'userId',e.user_id,'titleId',e.title_id::text,
 'visible',TG_OP<>'DELETE' AND e.score IS NOT NULL,'score',e.score,
 'review',e.review,'spoiler',e.spoiler,'publishedAt',e.first_rated_at,
 'actor',jsonb_build_object('username',u.username,'displayName',u.display_name,'avatarUrl',u.avatar_url),
 'title',jsonb_build_object('kind',t.kind,'tmdbId',t.tmdb_id,'name',t.title,
 'seriesTmdbId',t.series_tmdb_id,'seasonNumber',t.season_number,'episodeNumber',t.episode_number,
 'posterPath',t.poster_path,'backdropPath',t.backdrop_path)));
 RETURN NULL;
END $$;
CREATE TRIGGER entries_publish AFTER INSERT OR UPDATE OR DELETE ON entries FOR EACH ROW EXECUTE FUNCTION publish_entry();
-- Notas directas de películas y episodios. No se mezclan promedios de series con episodios.
CREATE VIEW profile_stats AS
 SELECT u.id user_id,
 (SELECT count(*) FROM follows f WHERE f.followed_id=u.id) followers,
 (SELECT count(*) FROM follows f WHERE f.follower_id=u.id) following,
 count(e.id) FILTER(WHERE t.kind='movie' AND e.watched_at IS NOT NULL) movies_watched,
 count(e.id) FILTER(WHERE t.kind='episode' AND e.watched_at IS NOT NULL) episodes_watched,
 count(e.score) ratings_count, round(avg(e.score),2) average_score
 FROM users u LEFT JOIN entries e ON e.user_id=u.id LEFT JOIN titles t ON t.id=e.title_id GROUP BY u.id;
CREATE VIEW season_scores AS
 SELECT e.user_id,t.series_tmdb_id,t.season_number,count(e.score) rated_episodes,round(avg(e.score),2) score
 FROM entries e JOIN titles t ON t.id=e.title_id WHERE t.kind='episode' AND e.score IS NOT NULL
 GROUP BY e.user_id,t.series_tmdb_id,t.season_number;
CREATE VIEW series_scores AS
 SELECT e.user_id,t.series_tmdb_id,count(e.score) rated_episodes,round(avg(e.score),2) score
 FROM entries e JOIN titles t ON t.id=e.title_id WHERE t.kind='episode' AND e.score IS NOT NULL
 GROUP BY e.user_id,t.series_tmdb_id;
COMMIT;
