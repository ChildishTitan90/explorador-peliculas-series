import Icon from "../components/Icon";
import { Heading, Grid } from "../components/ui";
export default function CollectionScreen({ page, saved, toggle }) {
  const tabs = [
    ["favoritos", "Favoritos"],
    ["quiero-ver", "Quiero ver"],
    ["ya-vi", "Ya vi"],
  ];
  const items = saved[page];
  return (
    <>
      <div
        className="ambient"
        style={{ backgroundImage: "url(/images/her.jpg)" }}
      />
      <Heading
        eyebrow="TU COLECCIÓN"
        title="Tus historias, en un solo lugar."
        subtitle="Las historias que tienen un lugar contigo."
      />
      <div className="chips">
        {tabs.map(([slug, label]) => (
          <a
            key={slug}
            className={`chip ${page === slug ? "active" : ""}`}
            href={`#/${slug}`}
          >
            {label}
          </a>
        ))}
      </div>
      <p className="collection-count">
        {items.length} {items.length === 1 ? "título" : "títulos"}
      </p>
      {items.length ? (
        <Grid {...{ items, saved, toggle }} />
      ) : (
        <div className="empty">
          <Icon
            name={
              page === "favoritos"
                ? "heart"
                : page === "ya-vi"
                  ? "check"
                  : "plus"
            }
          />
          <h2>Tu próxima historia empieza aquí.</h2>
          <p>
            Explora el catálogo y guarda los títulos que quieras tener cerca.
          </p>
          <a className="button light" href="#/explorar">
            Explorar historias
          </a>
        </div>
      )}
      <p className="storage-note">Guardado en este navegador</p>
    </>
  );
}
