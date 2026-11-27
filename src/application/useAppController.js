import { useEffect, useState } from "react";
import { keyOf } from "../presentation/moviePresentation";
function parseRoute() {
  const [path, search] = location.hash.replace(/^#\/?/, "").split("?");
  const [page = "", id = "", section = ""] = path.split("/");
  const params = new URLSearchParams(search);
  return {
    page,
    id,
    section,
    query: params.get("q") || "",
    reviewId: params.get("critica"),
  };
}
const lists = ["favoritos", "quiero-ver", "ya-vi"];
function readCollection() {
  try {
    const data = JSON.parse(localStorage.getItem("cinepollis.collection"));
    const saved = Object.fromEntries(
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
    const watched = new Set(saved["ya-vi"].map(keyOf));
    saved["quiero-ver"] = saved["quiero-ver"].filter(
      (item) => !watched.has(keyOf(item)),
    );
    return saved;
  } catch {
    return Object.fromEntries(lists.map((list) => [list, []]));
  }
}
export function useAppController(plans, auth, account) {
  const [route, setRoute] = useState(parseRoute);
  const [collection, setSaved] = useState(readCollection);
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
      localStorage.setItem("cinepollis.collection", JSON.stringify(collection));
    } catch {
      queueMicrotask(() => setStorageError(true));
    }
  }, [collection]);
  const shared = new Map((auth.user ? [] : plans).filter((p) => p.state === "complete" && p.type === "movie").map((p) => [keyOf(p.item), { ...p.item, sharedWatched: true }]));
  const saved = auth.user ? account.saved : { ...collection, "ya-vi": [...shared.values(), ...collection["ya-vi"].filter((item) => !shared.has(keyOf(item)))], "quiero-ver": collection["quiero-ver"].filter((item) => !shared.has(keyOf(item))) };
  const toggle = (list, item) => {
    if (auth.loading) return;
    if (auth.user) {
      if (!account.loading && !account.error) {
        account.setList(list, item, !saved[list].some((entry) => keyOf(entry) === keyOf(item)));
      }
      return;
    }
    if (list !== "favoritos" && shared.has(keyOf(item))) return;
    setSaved((previous) => {
      const matches = (entry) => keyOf(entry) === keyOf(item);
      if (previous[list].some(matches)) {
        return {
          ...previous,
          [list]: previous[list].filter((entry) => !matches(entry)),
        };
      }
      const next = {
        ...previous,
        [list]: [
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
      };
      const opposite = { "ya-vi": "quiero-ver", "quiero-ver": "ya-vi" }[list];
      if (opposite)
        next[opposite] = previous[opposite].filter((entry) => !matches(entry));
      return next;
    });
  };
  const { page, query } = route;
  const detail = ["pelicula", "serie"].includes(page);
  const active = detail
    ? page === "serie"
      ? "series"
      : "peliculas"
    : ["quiero-ver", "ya-vi"].includes(page)
      ? "favoritos"
      : page === "explorar"
        ? ""
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
