import { useCallback, useState } from "react";
import { useResource } from "./useResource";
import {
  fetchMixedCatalog,
  fetchPopularMovies,
  fetchPopularSeries,
  searchMovies,
  fetchDetails,
  fetchSeason,
} from "../services/interfaceApi";
import { fetchRandomHomeCatalog } from "../services/movieService";
import { genres, href } from "../presentation/moviePresentation";
import HomeScreen from "../screens/HomeScreen";
import CatalogScreen from "../screens/CatalogScreen";
import DetailScreen from "../screens/DetailScreen";
import SeasonScreen from "../screens/SeasonScreen";
import ModalView from "../components/ModalView";
export function Home(props) {
  const resource = useResource(fetchRandomHomeCatalog, []);
  return <HomeScreen {...props} resource={resource} />;
}

export function Catalog({ page, query: initialQuery, ...props }) {
  const [filter, setFilter] = useState("Todo");

  const [search, setSearch] = useState({
    query: initialQuery.trim(),
    number: 1,
  });

  const { query, number } = search;

  const isMovies = page === "peliculas";
  const isSeries = page === "series";

  const type = isMovies ? "movie" : isSeries ? "tv" : undefined;

  const onSearch = useCallback((text) => {
    setSearch((previous) => {
      if (previous.query === text) return previous;

      return {
        query: text,
        number: 1,
      };
    });

    setFilter("Todo");
  }, []);

  function setNumber(update) {
    setSearch((previous) => ({
      ...previous,
      number:
        typeof update === "function"
          ? update(previous.number)
          : update,
    }));
  }

  const resource = useResource(
    (signal) =>
      query
        ? searchMovies(query, number, signal, type)
        : isMovies
          ? fetchPopularMovies(number, signal)
          : isSeries
            ? fetchPopularSeries(number, signal)
            : fetchMixedCatalog(number, signal),
    [page, query, number],
  );

  const labels =
    isMovies || isSeries
      ? ["Todo", "Ciencia ficción", "Drama", "Aventura", "Misterio"]
      : ["Todo", "Películas", "Series"];

  const items = (resource.data || []).filter(
    (item) =>
      filter === "Todo" ||
      (filter === "Películas" && item.media_type === "movie") ||
      (filter === "Series" && item.media_type === "tv") ||
      genres(item).includes(filter),
  );

  return (
    <CatalogScreen
      {...props}
      {...{
        query,
        resource,
        filter,
        setFilter,
        number,
        setNumber,
        isMovies,
        isSeries,
        labels,
        items,
      }}
      onSearch={onSearch}
    />
  );
}

export function SeasonList({ item }) {
  const seasons = item.seasons?.filter((s) => s.season_number > 0) || [];
  const [number, setNumber] = useState(seasons[0]?.season_number || 1);
  const resource = useResource(
    (signal) => fetchSeason(item.id, number, signal),
    [item.id, number],
  );
  return <SeasonScreen {...{ item, seasons, number, setNumber, resource }} />;
}
export function Detail({ type, id, ...props }) {
  const resource = useResource(
    (signal) => fetchDetails(type, id, signal),
    [type, id],
  );
  const item = resource.data;
  return (
    <DetailScreen
      {...props}
      {...{ type, resource, item }}
      renderSeasons={(item) => <SeasonList item={item} />}
    />
  );
}
export function Modal({ modal, close }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const video = modal.item.videos?.results
    ?.filter((v) => v.site === "YouTube" && /^[\w-]{11}$/.test(v.key))
    .sort(
      (a, b) =>
        Number(b.type === "Trailer") - Number(a.type === "Trailer") ||
        Number(b.iso_639_1 === "es") - Number(a.iso_639_1 === "es"),
    )[0];
  const url = `${location.origin}${location.pathname}${href(modal.item)}`;
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <ModalView {...{ modal, close, video, url, copied, copyError, onCopy }} />
  );
}
