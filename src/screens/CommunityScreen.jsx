import { useState } from "react";
import { useResource } from "../application/useResource";
import { Status } from "../components/ui";
import { imageUrl } from "../presentation/moviePresentation";
import "../social/social.css";

async function loadActivity(cursor, signal) {
  const response = await fetch("/api/activity" + (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""), { signal, cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No pudimos cargar la comunidad.");
  return result;
}

function PublicReview({ entry }) {
  const [show, setShow] = useState(false);
  const title = entry.title;
  const episode = title.kind === "episode";
  const link = "#/" + (title.kind === "movie" ? "pelicula/" : "serie/") + (episode ? title.seriesTmdbId : title.tmdbId);
  return <article className="activity-card">
    <a className="activity-photo" href={link} aria-label={"Ver " + title.name}>
      <img src={imageUrl(title.backdropPath || title.posterPath)} alt="" loading="lazy" />
    </a>
    <div className="activity-card-content">
      <div className="activity-byline"><span>{entry.actor.displayName} <small>@{entry.actor.username}</small></span>
        <b aria-label={entry.score + " de 5 estrellas"}>★ {entry.score}/5</b></div>
      <h3><a href={link}>{title.name}</a></h3>
      {episode && <p>Temporada {title.seasonNumber} · Episodio {title.episodeNumber}</p>}
      {entry.review && (entry.spoiler && !show
        ? <button className="spoiler-button" onClick={() => setShow(true)}>Contiene spoilers · Mostrar crítica</button>
        : <p>{entry.review}</p>)}
      <time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString("es-MX")}</time>
    </div>
  </article>;
}

export default function CommunityScreen() {
  const [cursors, setCursors] = useState([null]);
  const cursor = cursors.at(-1);
  const resource = useResource(signal => loadActivity(cursor, signal), [cursor]);
  return <section className="social-activity">
    <div className="activity-heading"><h1>Actividad de la comunidad</h1>
      <button className="button glass" onClick={resource.retry}>Actualizar</button></div>
    <p>Calificaciones y críticas de personas con historial público.</p>
    <Status resource={resource}>
      <div className="social-grid">{resource.data?.entries.map(entry => <PublicReview key={entry.id + entry.review + entry.score} entry={entry} />)}</div>
      {!resource.data?.entries.length && <p>Todavía no hay calificaciones públicas en esta página.</p>}
      <div className="actions">
        {cursors.length > 1 && <button className="button glass" onClick={() => setCursors(old => old.slice(0, -1))}>Anterior</button>}
        {resource.data?.nextCursor && <button className="button glass" onClick={() => setCursors(old => [...old, resource.data.nextCursor])}>Siguiente</button>}
      </div>
    </Status>
  </section>;
}
