-- Ejemplos parametrizados para el backend; NO ejecutar todo como una migración.
-- $1 siempre proviene de la sesión verificada, nunca del userId enviado por el cliente.
-- Crear / editar una única nota, manteniendo primera fecha y sin duplicar actividad:
INSERT INTO cinepollis.entries(user_id,title_id,score,review,spoiler)
VALUES($1,$2,$3,$4,$5)
ON CONFLICT(user_id,title_id) DO UPDATE SET score=EXCLUDED.score,review=EXCLUDED.review,spoiler=EXCLUDED.spoiler;
-- Quitar solo la nota (conserva visto y favoritos):
UPDATE cinepollis.entries SET score=NULL WHERE user_id=$1 AND title_id=$2;
-- Perfil, promedio y desglose de películas / episodios:
SELECT * FROM cinepollis.profile_stats WHERE user_id=$1;
SELECT * FROM cinepollis.season_scores WHERE user_id=$1 AND series_tmdb_id=$2;
SELECT * FROM cinepollis.series_scores WHERE user_id=$1 AND series_tmdb_id=$2;
-- Notas de la ficha; paginar por fecha e id, no devolver email ni google_sub:
SELECT u.username,u.display_name,u.avatar_url,e.score,e.review,e.spoiler,e.first_rated_at
FROM cinepollis.entries e JOIN cinepollis.users u ON u.id=e.user_id
WHERE e.title_id=$1 AND e.score IS NOT NULL ORDER BY e.first_rated_at DESC,e.id DESC LIMIT 20;
-- Seguir / dejar de seguir:
INSERT INTO cinepollis.follows(follower_id,followed_id) VALUES($1,$2) ON CONFLICT DO NOTHING;
DELETE FROM cinepollis.follows WHERE follower_id=$1 AND followed_id=$2;
