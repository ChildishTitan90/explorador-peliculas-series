import { Status } from "../components/ui";
import { imageUrl } from "../presentation/moviePresentation";
export default function SeasonScreen({
  item,
  seasons,
  number,
  setNumber,
  resource,
}) {
  return (
    <section className="episodes">
      <label className="season-select">
        Temporada{" "}
        <select
          value={number}
          onChange={(event) => setNumber(Number(event.target.value))}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.season_number}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <Status resource={resource}>
        {resource.data?.episodes.map((episode) => (
          <article key={episode.id} className="episode glass">
            <img
              src={imageUrl(episode.still_path || item.backdrop_path, "w500")}
              alt=""
              loading="lazy"
            />
            <div>
              <p className="eyebrow">
                EPISODIO {String(episode.episode_number).padStart(2, "0")}{" "}
                {episode.runtime ? ` · ${episode.runtime} MIN` : ""}
              </p>
              <h3>{episode.name}</h3>
              <p>
                {episode.overview ||
                  "La sinopsis de este episodio todavía no está disponible."}
              </p>
            </div>
          </article>
        ))}
      </Status>
    </section>
  );
}
