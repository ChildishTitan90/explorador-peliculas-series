export const imageUrl = (path, size = "w780") =>
  path
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : "/images/placeholder.svg";
export const NAV = [
  ["Inicio", "", "home"],
  ["Explorar", "explorar", "explore"],
  ["Películas", "peliculas", "film"],
  ["Series", "series", "tv"],
  ["Favoritos", "favoritos", "heart"],
];
export const GENRES = {
  28: "Acción",
  12: "Aventura",
  16: "Animación",
  35: "Comedia",
  80: "Crimen",
  99: "Documental",
  18: "Drama",
  10751: "Familia",
  14: "Fantasía",
  36: "Historia",
  27: "Terror",
  10402: "Música",
  9648: "Misterio",
  10749: "Romance",
  878: "Ciencia ficción",
  10765: "Ciencia ficción",
  10759: "Aventura",
  53: "Suspenso",
  10752: "Guerra",
  37: "Western",
};
export const keyOf = (item) => `${item.media_type}:${item.id}`;
export const year = (item) => item.release_date?.slice(0, 4) || "Sin fecha";
export const rating = (item) =>
  item.vote_average ? item.vote_average.toFixed(1) : "—";
export const genres = (item) =>
  item.genres?.map((g) => GENRES[g.id] || g.name).join(" · ") ||
  item.genre_ids
    ?.map((id) => GENRES[id])
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ") ||
  (item.media_type === "tv" ? "Serie" : "Película");
export const backdrop = (item) =>
  ({
    157336: "/images/interstellar-bg.jpg",
    438631: "/images/dune-bg.jpg",
    70523: "/images/dark.jpg",
  })[item.id] || imageUrl(item.backdrop_path || item.poster_path, "original");
export const href = (item) =>
  `#/${item.media_type === "tv" ? "serie" : "pelicula"}/${item.id}`;
