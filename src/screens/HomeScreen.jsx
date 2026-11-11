import { useState, useRef } from "react";
import Icon from "../components/Icon";
import { Status, Heading, Grid, Button } from "../components/ui";
import {
  backdrop,
  imageUrl,
  keyOf,
  href,
  year,
  genres,
  rating,
} from "../presentation/moviePresentation";
export default function HomeScreen({ resource, saved, toggle }) {
  const [selected, setSelected] = useState(0);
  const start = useRef(null);
  const items = resource.data?.featured || [];
  const film = items[selected];
  const move = (delta) =>
    setSelected((n) => (n + delta + items.length) % items.length);
  return (
    <>
      <div
        className="ambient home-ambient"
        style={{ backgroundImage: film ? `url(${backdrop(film)})` : undefined }}
      />
      <Status resource={resource}>
        {film && (
          <>
            <section className="home-hero">
              <Heading
                eyebrow="DESCUBRE. SIENTE. REPITE."
                title={
                  <>
                    <span className="desktop-text">
                      Siempre hay otra gran historia.
                    </span>
                    <span className="mobile-text">
                      Tu próxima
                      <br />
                      gran historia.
                    </span>
                  </>
                }
              />
              <div
                className="carousel"
                aria-roledescription="carrusel"
                aria-label="Películas destacadas"
                tabIndex="0"
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight") move(1);
                  if (event.key === "ArrowLeft") move(-1);
                }}
                onTouchStart={(event) => {
                  start.current = event.touches[0].clientX;
                }}
                onTouchEnd={(event) => {
                  if (start.current !== null) {
                    const delta =
                      start.current - event.changedTouches[0].clientX;
                    if (Math.abs(delta) > 40) move(delta > 0 ? 1 : -1);
                    start.current = null;
                  }
                }}
              >
                <div className="poster-stage">
                  {items.map((item, i) => {
                    let offset = (i - selected + items.length) % items.length;
                    if (offset > items.length / 2) offset -= items.length;
                    return (
                      <button
                        key={keyOf(item)}
                        className={`poster poster-${Math.abs(offset)}`}
                        style={{ "--offset": offset }}
                        tabIndex={offset === 0 ? 0 : -1}
                        aria-hidden={Math.abs(offset) > 2}
                        aria-label={
                          offset === 0
                            ? `Ver detalles de ${item.title}`
                            : `Seleccionar ${item.title}`
                        }
                        onClick={() =>
                          offset === 0
                            ? (location.hash = href(item).slice(1))
                            : setSelected(i)
                        }
                      >
                        <img
                          src={imageUrl(item.poster_path, "w500")}
                          alt={item.title}
                        />
                      </button>
                    );
                  })}
                </div>
                <button
                  className="icon-button glass carousel-prev"
                  onClick={() => move(-1)}
                  aria-label="Película anterior"
                >
                  <Icon name="left" />
                </button>
                <button
                  className="icon-button glass carousel-next"
                  onClick={() => move(1)}
                  aria-label="Película siguiente"
                >
                  <Icon name="right" />
                </button>
              </div>
              <div className="selected-film" aria-live="polite">
                <h2>{film.title}</h2>
                <p>
                  {year(film)} <span>·</span> {genres(film)} <span>·</span>{" "}
                  ★ {rating(film)}
                </p>
                <div className="actions">
                  <a className="button light" href={href(film)}>
                    Ver detalles
                  </a>
                  <Button
                    icon="plus"
                    onClick={() => toggle("quiero-ver", film)}
                    aria-pressed={saved["quiero-ver"].some(
                      (m) => keyOf(m) === keyOf(film),
                    )}
                  >
                    Quiero ver
                  </Button>
                </div>
              </div>
            </section>
            <section className="home-recommendations">
              <div className="section-heading">
                <h2>Historias para tu próxima noche</h2>
                <a href="#/explorar">Ver todo →</a>
              </div>
              <Grid
                items={resource.data.catalog.slice(0, 3)}
                {...{ saved, toggle }}
              />
            </section>
          </>
        )}
      </Status>
    </>
  );
}
