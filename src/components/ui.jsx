import Icon from "./Icon";
import TitleMedia from "./TitleMedia";
import {
  imageUrl,
  keyOf,
  year,
  rating,
  genres,
  href,
} from "../presentation/moviePresentation";
import { useEffect, useRef, useState } from "react";
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
export function FavoriteButton({ liked, item, toggle, className = "" }) {
  return (
    <button type="button" className={["icon-button glass", className, liked && "liked"].filter(Boolean).join(" ")}
      aria-label={`${liked ? "Quitar de" : "Agregar a"} favoritos: ${item.title}`}
      aria-pressed={liked}
      onClick={(event) => {
        if (!liked && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          event.currentTarget.querySelector("svg").animate?.([
            { transform: "scale(1)" }, { transform: "scale(1.2)", offset: 0.4 },
            { transform: "scale(.96)", offset: 0.75 }, { transform: "scale(1)" },
          ], { duration: 320, easing: "ease-in-out" });
        }
        toggle("favoritos", item);
      }}>
      <Icon name="heart" filled={liked} />
    </button>
  );
}
export function Card({ item, saved, toggle, watchlistAction }) {
  const pending = watchlistAction && saved["quiero-ver"].some((m) => keyOf(m) === keyOf(item));
  const liked = saved.favoritos.some((m) => keyOf(m) === keyOf(item));
  return (
    <article className="card" style={{ "--card-still": `url(${imageUrl(item.backdrop_path || item.poster_path)})` }}>
      <a href={href(item)}>
        <TitleMedia type={item.media_type} id={item.id} title={item.title}
          image={imageUrl(item.backdrop_path || item.poster_path)}>
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
        </TitleMedia>
      </a>
      {watchlistAction && !saved["ya-vi"].some((entry) => entry.sharedWatched && keyOf(entry) === keyOf(item)) && <button type="button" className="friend-add" aria-pressed={pending} aria-label={(pending ? "Quitar de mi lista: " : "Agregar a mi Quiero ver: ") + item.title} onClick={() => toggle("quiero-ver", item)}>{pending ? "✓ En mi lista" : "+ Quiero ver"}</button>}
      <FavoriteButton liked={liked} item={item} toggle={toggle} className="card-heart" />
    </article>
  );
}
export function Grid({ items, saved, toggle, watchlistAction }) {
  return (
    <div className="movie-grid">
      {items.map((item) => (
        <Card key={keyOf(item)} {...{ item, saved, toggle, watchlistAction }} />
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
  const [value, setValue] = useState(initial);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setTimeout(() => {
      onSearch(value.trim());
    }, 350);

    return () => clearTimeout(timer.current);
  }, [value, onSearch]);

  function handleSubmit(event) {
    event.preventDefault();

    clearTimeout(timer.current);
    onSearch(value.trim());
  }

  return (
    <form
      className="search-field glass"
      role="search"
      onSubmit={handleSubmit}
    >
      <Icon name="search" />

      <input
        name="query"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Buscar películas o series por título"
        placeholder="Buscar películas o series…"
        autoComplete="off"
      />

      <button type="submit">
        Buscar <span aria-hidden="true">↵</span>
      </button>
    </form>
  );
}
