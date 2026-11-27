import { useState } from "react";
import { useAccount } from "../application/AccountContext";
import { useResource } from "../application/useResource";
import { fetchSeason } from "../services/interfaceApi";
import { Status } from "../components/ui";
import RatingEditor from "../social/RatingEditor";

function RatingForm({ item, account }) {
  const [notice, setNotice] = useState("");
  const mine = account.entries.find((entry) => entry.item.media_type === item.media_type && entry.item.id === item.id && entry.score !== null);
  async function save(rating) {
    try {
      await account.saveRating(item, rating);
      setNotice("Calificación guardada en tu cuenta.");
      return true;
    } catch (error) { setNotice(error.message); return false; }
  }
  async function remove() {
    try {
      await account.removeRating(item);
      setNotice("Calificación eliminada. Se conserva el título como visto.");
      return true;
    } catch (error) { setNotice(error.message); return false; }
  }
  return <>
    <RatingEditor key={mine ? mine.id + ":" + mine.score + ":" + mine.review + ":" + mine.spoiler : "new"}
      mine={mine} onSave={save} onDelete={remove} />
    <p role="status">{notice}</p>
  </>;
}

function EpisodeRatings({ item, season, account, requestedEpisode }) {
  const resource = useResource((signal) => fetchSeason(item.id, season, signal), [item.id, season]);
  const [selected, setSelected] = useState("");
  const episodes = resource.data?.episodes || [];
  const episode = episodes.find((entry) => String(entry.id) === selected)
    || episodes.find((entry) => entry.id === requestedEpisode) || episodes[0];
  return <Status resource={resource}>
    {episodes.length ? <>
      <label className="season-select">Episodio
        <select value={episode?.id || ""} onChange={(event) => setSelected(event.target.value)}>
          {episodes.map((entry) => <option key={entry.id} value={entry.id}>{entry.episode_number}. {entry.name}</option>)}
        </select>
      </label>
      {episode && <RatingForm key={episode.id} account={account} item={{
        id: episode.id, media_type: "episode", seriesId: item.id,
        season, episode: episode.episode_number,
      }} />}
    </> : <p>No hay episodios disponibles en esta temporada.</p>}
  </Status>;
}

export default function MyRatingPanel({ item, type, reviewId }) {
  const account = useAccount();
  const seasons = item.seasons?.filter((season) => season.season_number > 0) || [];
  const requested = account.entries.find((entry) => entry.id === reviewId);
  const [selection, setSeason] = useState(null);
  const selectedSeason = selection ?? requested?.item.season ?? seasons[0]?.season_number ?? 1;
  const episodeRatings = account.entries.filter((entry) =>
    entry.item.media_type === "episode" && entry.item.seriesId === item.id && entry.score !== null);
  const average = episodeRatings.length
    ? (episodeRatings.reduce((sum, entry) => sum + entry.score, 0) / episodeRatings.length).toFixed(2) : null;
  return (
    <section className="social-ratings">
      <h2>Tus calificaciones</h2>
      <p>TMDb · promedio de su comunidad: {item.vote_average?.toFixed(1) || "—"}/10</p>
      {!account.user ? <p><a href="#/acceso">Inicia sesión para guardar tus calificaciones.</a></p>
        : account.loading ? <p role="status">Cargando tus calificaciones…</p>
          : account.error ? <p role="alert">{account.error}</p>
            : type === "tv" ? <>
              <p>Califica cada episodio. {average ? "Tu promedio de la serie es " + average + "/5." : "Tu promedio se calculará con los episodios que califiques."}</p>
              {seasons.length ? <>
                <label className="season-select">Temporada
                  <select value={selectedSeason} onChange={(event) => setSeason(Number(event.target.value))}>
                    {seasons.map((season) => <option key={season.id} value={season.season_number}>{season.name}</option>)}
                  </select>
                </label>
                <EpisodeRatings key={selectedSeason} item={item} season={selectedSeason} account={account} requestedEpisode={requested?.item.id} />
              </> : <p>No hay temporadas disponibles.</p>}
            </> : <RatingForm item={{ ...item, media_type: "movie" }} account={account} />}
    </section>
  );
}
