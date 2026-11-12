import { useState } from "react";
import Icon from "../components/Icon";
import { Status, Button, Grid } from "../components/ui";
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
}) {
  const [section, setSection] = useState("info");
  const inList = (list) => saved[list].some((m) => keyOf(m) === keyOf(item));
  return (
    <Status resource={resource}>
      {item && (
        <>
          <div
            className="detail-backdrop"
            style={{ backgroundImage: `url(${backdrop(item)})` }}
          />
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
              <Button
                light
                icon="play"
                onClick={() => openModal("trailer", item)}
              >
                Ver tráiler
              </Button>
              <Button
                icon={inList("quiero-ver") ? "check" : "plus"}
                onClick={() => toggle("quiero-ver", item)}
                aria-pressed={inList("quiero-ver")}
              >
                Quiero ver
              </Button>
              <button
                className={`icon-button glass ${inList("favoritos") ? "liked" : ""}`}
                aria-label="Dar corazón"
                aria-pressed={inList("favoritos")}
                onClick={() => toggle("favoritos", item)}
              >
                <Icon name="heart" filled={inList("favoritos")} />
              </button>
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
              aria-pressed={inList("ya-vi")}
              onClick={() => toggle("ya-vi", item)}
            >
              <Icon name="check" />
              {inList("ya-vi") ? "Ya la vi" : "Marcar como vista"}
            </button>
          </section>
          <button
            className="icon-button glass backdrop-play"
            aria-label="Abrir tráiler"
            onClick={() => openModal("trailer", item)}
          >
            <Icon name="play" />
          </button>
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
