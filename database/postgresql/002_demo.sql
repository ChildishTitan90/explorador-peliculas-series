-- Datos ficticios opcionales. Sin personas, correos ni credenciales reales.
BEGIN;
SET search_path=cinepollis,public;
INSERT INTO users(id,google_sub,username,display_name,bio) VALUES
 ('00000000-0000-4000-8000-000000000001','demo-pablo','pablo','Pablo','Historias que se quedan conmigo.'),
 ('00000000-0000-4000-8000-000000000002','demo-ana','ana','Ana','Una película más.');
INSERT INTO follows(follower_id,followed_id) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
INSERT INTO titles(kind,tmdb_id,title,backdrop_path) VALUES('movie',157336,'Interestelar',NULL);
INSERT INTO titles(kind,tmdb_id,title,series_tmdb_id,season_number,episode_number) VALUES('episode',1343403,'Secretos',70523,1,1);
INSERT INTO entries(user_id,title_id,score,review,spoiler)
 SELECT '00000000-0000-4000-8000-000000000002',id,4.5,'De esas historias que quieres volver a ver.',false FROM titles WHERE kind='movie' AND tmdb_id=157336;
INSERT INTO entries(user_id,title_id,score)
 SELECT '00000000-0000-4000-8000-000000000001',id,0 FROM titles WHERE kind='episode' AND tmdb_id=1343403;
COMMIT;
