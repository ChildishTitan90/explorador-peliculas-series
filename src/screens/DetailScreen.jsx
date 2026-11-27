import MyRatingPanel from "./MyRatingPanel";
import TrailerPreview from "../components/TrailerPreview";
import { chooseTrailer } from "../services/interfaceApi";
import { useRef, useState } from "react";
import Icon from "../components/Icon";
import { Status, Button, Grid, FavoriteButton } from "../components/ui";
import {
  backdrop,
  genres,
  rating,
  year,
  keyOf,
} from "../presentation/moviePresentation";
export default function DetailScreen({
  type,
  resource,
  item,
  saved,
  toggle,
  openModal,
  renderSeasons,
  reviewId,
}) {
  const [section, setSection] = useState("info");
  const [preview, setPreview] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "paused" : "active");
  const position = useRef(0);
  const video = chooseTrailer(item?.videos?.results);
  const available = video && preview !== "unavailable";
  const sharedWatched = Boolean(item) && saved["ya-vi"].some((entry) => entry.sharedWatched && keyOf(entry) === keyOf(item));
  const inList = (list) => saved[list].some((m) => keyOf(m) === keyOf(item));
  return (
    <Status resource={resource}>
      {item && (
        <>
          <div
            className="detail-backdrop"
            style={{ backgroundImage: `url(${backdrop(item)})` }}
          >
            {available && preview === "active" && <TrailerPreview video={video.key} title={item.title} start={0} position={position} onStop={setPreview} />}
          </div>
          {available && <button
            className="backdrop-toggle"
            aria-label={preview === "active" ? "Pausar avance de fondo" : "Reproducir avance de fondo"}
            onClick={() => {
              if (preview === "ended") position.current = 0;
              setPreview(preview === "active" ? "paused" : "active");
            }}
          />}
          <a
            className="back-link"
            href={type === "tv" ? "#/series" : "#/peliculas"}
          >
            ← <span>Volver a {type === "tv" ? "series" : "películas"}</span>
          </a>
          <section className="detail-main">
            <p className="eyebrow">{genres(item)}</p>
            <h1>{item.title}</h1>
            <p className="detail-meta">
              ★ {rating(item)} <span>{year(item)}</span>
              <span>
                {type === "tv"
                  ? `${item.number_of_seasons} temporadas`
                  : item.runtime
                    ? `${Math.floor(item.runtime / 60)} h ${item.runtime % 60} min`
                    : "Duración no disponible"}
              </span>
            </p>
            {item.tagline && <h2 className="tagline">{item.tagline}</h2>}
            <p className="synopsis">
              {item.overview ||
                "La sinopsis todavía no está disponible en español."}
            </p>
            <div className="actions">
              {available && <Button
                light
                icon="play"
                onClick={() => { setPreview("paused"); openModal("trailer", item); }}
              >
                Ver tráiler
              </Button>}
              <Button
                icon={inList("quiero-ver") ? "check" : "plus"}
                disabled={sharedWatched}
                onClick={() => toggle("quiero-ver", item)}
                aria-pressed={inList("quiero-ver")}
              >
                Quiero ver
              </Button>
              <FavoriteButton liked={inList("favoritos")} item={item} toggle={toggle} />
              <button
                className="icon-button glass"
                aria-label="Compartir enlace"
                onClick={() => openModal("share", item)}
              >
                <Icon name="share" />
              </button>
            </div>
            <button
              className="watched"
              disabled={sharedWatched}
              aria-pressed={inList("ya-vi")}
              onClick={() => toggle("ya-vi", item)}
            >
              <Icon name="check" />
              {inList("ya-vi") ? "Ya la vi" : "Marcar como vista"}
            </button>
          </section>
          <MyRatingPanel
            key={`${type}:${item.id}:${reviewId || ""}`}
            reviewId={reviewId}
            item={item}
            type={type}
          />
          <section className="detail-info">
            {type === "tv" && (
              <div className="chips">
                <button
                  className={`chip ${section === "info" ? "active" : ""}`}
                  onClick={() => setSection("info")}
                >
                  Información
                </button>
                <button
                  className={`chip ${section === "episodes" ? "active" : ""}`}
                  onClick={() => setSection("episodes")}
                >
                  Temporadas y episodios
                </button>
              </div>
            )}
            {section === "episodes" && type === "tv" ? (
              renderSeasons(item)
            ) : (
              <div className="credits">
                <div>
                  <p className="eyebrow">
                    {type === "tv" ? "CREADORES" : "DIRECCIÓN"}
                  </p>
                  <p>
                    {(type === "tv"
                      ? item.created_by
                      : item.credits?.crew.filter(
                          (person) => person.job === "Director",
                        )
                    )
                      ?.map((person) => person.name)
                      .join(" · ") || "Sin información"}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">REPARTO</p>
                  <p>
                    {item.credits?.cast
                      .slice(0, 5)
                      .map((person) => person.name)
                      .join(" · ") || "Sin información"}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">DÓNDE VER EN MÉXICO</p>
                  {item["watch/providers"]?.results?.MX?.link ? (
                    <a
                      href={item["watch/providers"].results.MX.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Consultar disponibilidad ↗
                    </a>
                  ) : (
                    <p>Sin disponibilidad informada.</p>
                  )}
                </div>
              </div>
            )}
          </section>
          {item.recommendations?.results?.length > 0 && (
            <section className="recommendations">
              <div className="section-heading">
                <h2>Si te gustó {item.title}</h2>
              </div>
              <Grid
                items={item.recommendations.results.slice(0, 3).map((m) => ({
                  ...m,
                  title: m.title || m.name,
                  media_type: type,
                  release_date: m.release_date || m.first_air_date,
                }))}
                {...{ saved, toggle }}
              />
            </section>
          )}
        </>
      )}
    </Status>
  );
}
