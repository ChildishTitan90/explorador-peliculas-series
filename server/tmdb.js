import { fail } from "./auth.js";

export async function tmdbTitle(identity) {
  const { kind, id, seriesId, season, episode } = identity || {};
  if (!["movie", "tv", "episode"].includes(kind) || !Number.isSafeInteger(id) || id <= 0) {
    fail(400, "El título no es válido.");
  }
  if (kind === "episode" && (!Number.isSafeInteger(seriesId) || seriesId <= 0
    || !Number.isSafeInteger(season) || season < 0 || !Number.isSafeInteger(episode) || episode <= 0)) {
    fail(400, "Selecciona una temporada y un episodio válidos.");
  }
  const key = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
  const token = process.env.TMDB_READ_TOKEN || process.env.VITE_TMDB_READ_TOKEN;
  if (!key && !token) fail(503, "Falta configurar el catálogo en el servidor.");
  const path = kind === "episode" ? "/tv/" + seriesId + "/season/" + season + "/episode/" + episode
    : "/" + kind + "/" + id;
  const url = new URL("https://api.themoviedb.org/3" + path);
  url.searchParams.set("language", "es-MX");
  if (!token) url.searchParams.set("api_key", key);
  let response;
  try {
    response = await fetch(url, {
      headers: token ? { Authorization: "Bearer " + token } : {},
      signal: AbortSignal.timeout(8000),
    });
  } catch { fail(503, "No pudimos consultar el título. Intenta nuevamente."); }
  if (response.status === 404) fail(404, "El título no existe en TMDb.");
  if (!response.ok) fail(503, "No pudimos validar el título en TMDb.");
  const item = await response.json();
  if (item.id !== id) fail(400, "El episodio no coincide con su identificador.");
  return {
    kind, id, seriesId: kind === "episode" ? seriesId : null,
    season: kind === "episode" ? season : null, episode: kind === "episode" ? episode : null,
    title: item.title || item.name,
    poster: item.poster_path || item.still_path || null,
    backdrop: item.backdrop_path || item.still_path || null,
    presentation: {
      release_date: item.release_date || item.first_air_date || item.air_date || "",
      vote_average: item.vote_average || 0,
      genre_ids: item.genres?.map((genre) => genre.id) || [],
    },
  };
}
