import { useEffect, useState } from "react";
import { keyOf } from "../presentation/moviePresentation";
function parseRoute() {
  const [page = "", id = "", section = ""] = location.hash
    .replace(/^#\/?/, "")
    .split("/");
  return { page, id, section };
}
const lists = ["favoritos", "quiero-ver", "ya-vi"];
function readCollection() {
  try {
    const data = JSON.parse(localStorage.getItem("cinepollis.collection"));
    return Object.fromEntries(
      lists.map((list) => [
        list,
        Array.isArray(data?.[list])
          ? data[list].filter(
              (item) =>
                item &&
                ["movie", "tv"].includes(item.media_type) &&
                Number.isInteger(item.id),
            )
          : [],
      ]),
    );
  } catch {
    return Object.fromEntries(lists.map((list) => [list, []]));
  }
}
export function useAppController() {
  const [route, setRoute] = useState(parseRoute);
  const [saved, setSaved] = useState(readCollection);
  const [modal, setModal] = useState(null);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const handler = () => {
      setRoute(parseRoute());
      setModal(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("cinepollis.collection", JSON.stringify(saved));
    } catch {
      queueMicrotask(() => setStorageError(true));
    }
  }, [saved]);
  const toggle = (list, item) =>
    setSaved((previous) => ({
      ...previous,
      [list]: previous[list].some((m) => keyOf(m) === keyOf(item))
        ? previous[list].filter((m) => keyOf(m) !== keyOf(item))
        : [
            ...previous[list],
            {
              id: item.id,
              media_type: item.media_type,
              title: item.title,
              release_date: item.release_date,
              vote_average: item.vote_average,
              poster_path: item.poster_path,
              backdrop_path: item.backdrop_path,
              genre_ids: item.genre_ids || item.genres?.map((g) => g.id),
            },
          ],
    }));
  const [page, queryString = ""] = route.page.split("?");
  const query = new URLSearchParams(queryString).get("q") || "";
  const detail = ["pelicula", "serie"].includes(page);
  const active = detail
    ? page === "serie"
      ? "series"
      : "peliculas"
    : ["quiero-ver", "ya-vi"].includes(page)
      ? "favoritos"
      : page;
  return {
    route,
    saved,
    toggle,
    modal,
    setModal,
    storageError,
    page,
    query,
    detail,
    active,
  };
}
