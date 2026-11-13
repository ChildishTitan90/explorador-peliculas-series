const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN;
export const hasCredentials = Boolean(API_KEY || TOKEN);
export const imageUrl = (path, size = "w780") =>
  path
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : "/images/placeholder.svg";

export const normalize = (item, type = item.media_type || "movie") => ({
  ...item,
  media_type: type,
  title: item.title || item.name || "Sin título",
  release_date: item.release_date || item.first_air_date || "",
});

export async function request(path, params = {}, signal) {
  if (!hasCredentials) throw new Error("Falta configurar el acceso a TMDb.");
  const query = new URLSearchParams({ language: "es-MX", ...params });
  if (!TOKEN) query.set("api_key", API_KEY);
  const response = await fetch(`${BASE_URL}${path}?${query}`, {
    signal,
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "No pudimos validar el acceso a TMDb."
        : "No pudimos cargar las historias. Inténtalo de nuevo.",
    );
  return response.json();
}

export async function fetchPopularMovies(page = 1, signal) {
  const data = await request("/movie/popular", { page }, signal);
  return data.results.map((item) => normalize(item, "movie"));
}

export async function fetchPopularSeries(page = 1, signal) {
  const data = await request("/tv/popular", { page }, signal);
  return data.results.map((item) => normalize(item, "tv"));
}

export async function fetchMixedCatalog(page = 1, signal) {
  const [movies, series] = await Promise.all([
    fetchPopularMovies(page, signal),
    fetchPopularSeries(page, signal),
  ]);
  return movies.flatMap((movie, i) =>
    series[i] ? [movie, series[i]] : [movie],
  );
}

export const fetchCatalogMovies = fetchMixedCatalog;

export async function searchMovies(query, page = 1, signal, type) {
  if (!query.trim()) return [];
  // Search the two title endpoints: people are intentionally excluded.
  const groups = await Promise.all(
    (type ? [type] : ["movie", "tv"]).map(async (type) => {
      const data = await request(
        `/search/${type}`,
        { query, page, include_adult: "false" },
        signal,
      );
      return data.results.map((item) => normalize(item, type));
    }),
  );
  const title = query.trim().toLocaleLowerCase("es");
  const rank = (item) =>
    item.title.toLocaleLowerCase("es") === title
      ? 0
      : item.title.toLocaleLowerCase("es").startsWith(title)
        ? 1
        : 2;
  return groups
    .flat()
    .sort((a, b) => rank(a) - rank(b) || b.popularity - a.popularity);
}
export async function fetchDetails(type, id, signal) {
  return normalize(
    await request(
      `/${type}/${id}`,
      {
        append_to_response: "credits,videos,recommendations,watch/providers",
        include_video_language: "es,en,null",
      },
      signal,
    ),
    type,
  );
}
export const fetchSeason = (id, season, signal) =>
  request(`/tv/${id}/season/${season}`, {}, signal);
