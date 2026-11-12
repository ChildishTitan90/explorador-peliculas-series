import Icon from "./Icon";
import {
  imageUrl,
  keyOf,
  year,
  rating,
  genres,
  href,
} from "../presentation/moviePresentation";
export function Status({ resource, children }) {
  if (resource.loading)
    return (
      <div className="status" role="status">
        <span className="spinner" />
        Buscando tu próxima historia…
      </div>
    );
  if (resource.error)
    return (
      <div className="status" role="alert">
        <p>{resource.error}</p>
        <button className="button glass" onClick={resource.retry}>
          Volver a intentar
        </button>
      </div>
    );
  return children;
}
export function Brand() {
  return (
    <a className="brand" href="#/" aria-label="Cinepollis, inicio">
      <span className="brand-mark">
        <i />
        <i />
      </span>
      cinepollis
    </a>
  );
}
export function Button({ icon, children, light, className = "", ...props }) {
  return (
    <button
      className={`button ${light ? "light" : "glass"} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} />} {children}
    </button>
  );
}
export function Card({ item, saved, toggle }) {
  const liked = saved.favoritos.some((m) => keyOf(m) === keyOf(item));
  return (
    <article className="card">
      <a href={href(item)}>
        <img
          src={imageUrl(item.backdrop_path || item.poster_path)}
          alt=""
          loading="lazy"
        />
        <div className="card-band">
          <h3>{item.title}</h3>
          <p>
            <span className="warm">★ {rating(item)}</span>
            <span>
              {" "}
              · {year(item)} · {genres(item)}
            </span>
          </p>
        </div>
      </a>
      <button
        className={`icon-button glass card-heart ${liked ? "liked" : ""}`}
        aria-label={`${liked ? "Quitar de" : "Agregar a"} favoritos: ${item.title}`}
        aria-pressed={liked}
        onClick={() => toggle("favoritos", item)}
      >
        <Icon name="heart" filled={liked} />
      </button>
    </article>
  );
}
export function Grid({ items, saved, toggle }) {
  return (
    <div className="movie-grid">
      {items.map((item) => (
        <Card key={keyOf(item)} {...{ item, saved, toggle }} />
      ))}
    </div>
  );
}
export function Heading({ eyebrow, title, subtitle }) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
export function Search({ initial = "", onSearch }) {
  return (
    <form
      className="search-field glass"
      onSubmit={(event) => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get("query").trim();
        onSearch(query);
      }}
    >
      <Icon name="search" />
      <input
        key={initial}
        name="query"
        defaultValue={initial}
        aria-label="Buscar películas o series por título"
        placeholder="Buscar películas o series…"
      />
      <button type="submit">
        Buscar <span aria-hidden="true">↵</span>
      </button>
    </form>
  );
}
