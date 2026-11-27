BEGIN;
SET LOCAL search_path = cinepollis, public;
ALTER TABLE users ADD COLUMN public_history boolean NOT NULL DEFAULT true;
CREATE FUNCTION today_mx() RETURNS date LANGUAGE sql STABLE AS $$
 SELECT (current_timestamp AT TIME ZONE 'America/Mexico_City')::date
$$;
CREATE TABLE movie_views (
 user_id uuid REFERENCES users ON DELETE CASCADE,
 title_id bigint REFERENCES titles,
 day date NOT NULL DEFAULT today_mx(),
 personal boolean NOT NULL DEFAULT true,
 PRIMARY KEY(user_id,title_id,day)
);
CREATE INDEX movie_views_calendar ON movie_views(user_id,day DESC);
-- Una fecha comprobable por entrada antigua; no se inventan repeticiones.
INSERT INTO movie_views(user_id,title_id,day)
SELECT e.user_id,e.title_id,(e.watched_at AT TIME ZONE 'America/Mexico_City')::date
FROM entries e JOIN titles t ON t.id=e.title_id WHERE e.watched_at IS NOT NULL AND t.kind='movie';

CREATE TABLE shared_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sender uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 recipient uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('movie','tv')),
 state text NOT NULL DEFAULT 'invited' CHECK(state IN ('invited','vote','agreed','exhausted','complete','cancelled')),
 title_id bigint REFERENCES titles,
 sender_vote boolean NOT NULL DEFAULT false,
 recipient_vote boolean NOT NULL DEFAULT false,
 sender_seen date, recipient_seen date,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(sender<>recipient),
 CHECK(state NOT IN ('vote','agreed','complete') OR title_id IS NOT NULL),
 CHECK(state NOT IN ('agreed','complete') OR (sender_vote AND recipient_vote)),
 CHECK(state IN ('agreed','complete','cancelled') OR (sender_seen IS NULL AND recipient_seen IS NULL)),
 CHECK(state <> 'complete' OR (sender_seen IS NOT NULL AND recipient_seen IS NOT NULL))
);
CREATE UNIQUE INDEX one_open_plan ON shared_plans(least(sender,recipient),greatest(sender,recipient),kind)
WHERE state NOT IN ('complete','cancelled');
CREATE TABLE passed_titles (
 plan_id uuid REFERENCES shared_plans ON DELETE CASCADE, title_id bigint REFERENCES titles,
 PRIMARY KEY(plan_id,title_id)
);
CREATE FUNCTION sync_first_rating() RETURNS trigger LANGUAGE plpgsql SET search_path=cinepollis,public AS $$
BEGIN
 IF NEW.score IS NOT NULL AND NOT EXISTS(SELECT 1 FROM movie_views WHERE user_id=NEW.user_id AND title_id=NEW.title_id)
 AND EXISTS(SELECT 1 FROM titles WHERE id=NEW.title_id AND kind='movie') THEN
   INSERT INTO movie_views(user_id,title_id) VALUES(NEW.user_id,NEW.title_id) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER rating_view AFTER INSERT OR UPDATE OF score ON entries FOR EACH ROW EXECUTE FUNCTION sync_first_rating();

-- Para la API: día y hora determinados por el servidor. Serializar por película/usuario.
CREATE FUNCTION record_movie(u uuid,t bigint, via_plan uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SET search_path=cinepollis,public AS $$
DECLARE p shared_plans;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(u::text||':'||t::text,0));
 IF NOT EXISTS(SELECT 1 FROM titles WHERE id=t AND kind='movie') THEN RAISE EXCEPTION 'Se requiere película'; END IF;
 IF via_plan IS NOT NULL THEN
   SELECT * INTO STRICT p FROM shared_plans WHERE id=via_plan AND title_id=t AND kind='movie' AND u IN(sender,recipient) FOR UPDATE;
   IF p.state IN ('complete','agreed') AND (CASE WHEN u=p.sender THEN p.sender_seen ELSE p.recipient_seen END) IS NOT NULL THEN RETURN; END IF;
   IF p.state<>'agreed' THEN RAISE EXCEPTION 'Falta aceptar el título'; END IF;
   UPDATE shared_plans SET sender_seen=CASE WHEN sender=u THEN today_mx() ELSE sender_seen END,
     recipient_seen=CASE WHEN recipient=u THEN today_mx() ELSE recipient_seen END,
     state=CASE WHEN (sender=u AND recipient_seen IS NOT NULL) OR (recipient=u AND sender_seen IS NOT NULL) THEN 'complete' ELSE 'agreed' END,
     updated_at=now() WHERE id=via_plan;
 END IF;
 INSERT INTO movie_views VALUES(u,t,today_mx(),via_plan IS NULL)
 ON CONFLICT(user_id,title_id,day) DO UPDATE SET personal=movie_views.personal OR excluded.personal;
 INSERT INTO entries(user_id,title_id,watched_at,watchlist) VALUES(u,t,now(),false)
 ON CONFLICT(user_id,title_id) DO UPDATE SET watched_at=coalesce(entries.watched_at,excluded.watched_at),watchlist=false;
END $$;

CREATE FUNCTION undo_movie_today(u uuid,t bigint,via_plan uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SET search_path=cinepollis,public AS $$
DECLARE d date := today_mx(); personal_view boolean; linked boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(u::text||':'||t::text,0));
 IF EXISTS(SELECT 1 FROM shared_plans WHERE state='complete' AND title_id=t AND
 ((sender=u AND sender_seen=d) OR (recipient=u AND recipient_seen=d))) THEN RAISE EXCEPTION 'Vista compartida protegida'; END IF;
 IF via_plan IS NOT NULL THEN
   UPDATE shared_plans SET sender_seen=CASE WHEN sender=u THEN NULL ELSE sender_seen END,
    recipient_seen=CASE WHEN recipient=u THEN NULL ELSE recipient_seen END, updated_at=now()
    WHERE id=via_plan AND title_id=t AND state='agreed' AND ((sender=u AND sender_seen=d) OR (recipient=u AND recipient_seen=d));
   IF NOT FOUND THEN RAISE EXCEPTION 'Esta confirmación no se puede retirar'; END IF;
 ELSE
   UPDATE movie_views SET personal=false WHERE user_id=u AND title_id=t AND day=d;
 END IF;
 SELECT personal INTO personal_view FROM movie_views WHERE user_id=u AND title_id=t AND day=d;
 SELECT EXISTS(SELECT 1 FROM shared_plans WHERE title_id=t AND state IN ('agreed','complete') AND
 ((sender=u AND sender_seen=d) OR (recipient=u AND recipient_seen=d))) INTO linked;
 IF personal_view OR linked THEN RETURN; END IF;
 DELETE FROM movie_views WHERE user_id=u AND title_id=t AND day=d;
 IF FOUND AND NOT EXISTS(SELECT 1 FROM movie_views WHERE user_id=u AND title_id=t) THEN
   IF EXISTS(SELECT 1 FROM entries WHERE user_id=u AND title_id=t AND score IS NOT NULL) THEN
     RAISE EXCEPTION 'Edita tu calificación antes de quitar la última vista';
   END IF;
   UPDATE entries SET watched_at=NULL WHERE user_id=u AND title_id=t;
 END IF;
END $$;

CREATE VIEW plan_candidates AS
 SELECT a.user_id AS viewer,b.user_id AS friend,a.title_id,t.kind
 FROM entries a JOIN entries b ON b.title_id=a.title_id AND b.user_id<>a.user_id
 JOIN titles t ON t.id=a.title_id WHERE a.watchlist AND b.watchlist AND a.watched_at IS NULL AND b.watched_at IS NULL AND t.kind IN ('movie','tv');

CREATE FUNCTION viewing_rank(period text,n bigint) RETURNS text LANGUAGE sql IMMUTABLE AS $$
 SELECT CASE period WHEN 'month' THEN CASE WHEN n>=25 THEN 'Platino' WHEN n>=18 THEN 'Oro' WHEN n>=10 THEN 'Plata' WHEN n>=5 THEN 'Bronce' END
 WHEN 'year' THEN CASE WHEN n>=300 THEN 'Platino' WHEN n>=210 THEN 'Oro' WHEN n>=120 THEN 'Plata' WHEN n>=60 THEN 'Bronce' END END
$$;
CREATE VIEW viewing_stats AS
 SELECT user_id,period,date_trunc(period,day::timestamp)::date AS starts_on,count(*) AS views,viewing_rank(period,count(*)) AS rank
 FROM movie_views CROSS JOIN (VALUES ('week'),('month'),('year')) periods(period)
 GROUP BY user_id,period,date_trunc(period,day::timestamp)::date;
CREATE VIEW annual_badges AS SELECT * FROM viewing_stats WHERE period='year' AND rank IS NOT NULL
 AND starts_on<date_trunc('year',today_mx()::timestamp)::date;
CREATE FUNCTION viewing_history(viewer uuid,profile uuid,from_day date,until_day date)
RETURNS TABLE(day date,title_id bigint,title text) LANGUAGE sql STABLE SET search_path=cinepollis,public AS $$
 SELECT v.day,t.id,t.title FROM movie_views v JOIN users u ON u.id=v.user_id JOIN titles t ON t.id=v.title_id
 WHERE u.id=profile AND (u.public_history OR u.id=viewer) AND v.day>=from_day AND v.day<until_day ORDER BY v.day DESC,t.title
$$;
COMMIT;
