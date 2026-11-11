import { Heading, Search, Status, Grid, Button } from "../components/ui";
export default function CatalogScreen({
  query,
  saved,
  toggle,
  resource,
  filter,
  setFilter,
  number,
  setNumber,
  isMovies,
  isSeries,
  labels,
  items,
  onSearch,
}) {
  return (
    <>
      <div
        className="ambient"
        style={{ backgroundImage: "url(/images/dune-bg.jpg)" }}
      />
      <Heading
        eyebrow={
          query
            ? "EXPLORAR"
            : isMovies
              ? "PARA PERDER LA NOCIÓN DEL TIEMPO"
              : isSeries
                ? "HISTORIAS QUE CONTINÚAN"
                : "ELIGE TU PRÓXIMA HISTORIA"
        }
        title={
          query
            ? "Una búsqueda. Muchas historias."
            : isMovies
              ? "Una buena película lo cambia todo."
              : isSeries
                ? "Solo un episodio más."
                : "¿Qué historia buscas hoy?"
        }
        subtitle={
          query
            ? `Resultados por título para “${query}”.`
            : "Películas y series para cada momento."
        }
      />
      <Search initial={query} onSearch={onSearch} />
      <div className="chips">
        {labels.map((label) => (
          <button
            key={label}
            className={`chip ${filter === label ? "active" : ""}`}
            onClick={() => setFilter(label)}
            aria-pressed={filter === label}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="section-heading catalog-heading">
        <h2>
          {query
            ? "Coincidencias con tu búsqueda"
            : "Encuentra tu próxima historia"}
        </h2>
        <span>{query ? "Relevancia" : "Popularidad"} ↓</span>
      </div>
      <Status resource={resource}>
        {items.length ? (
          <Grid {...{ items, saved, toggle }} />
        ) : (
          <div className="status">
            No encontramos historias aquí. Prueba con otro título o filtro.
          </div>
        )}
        <div className="pagination">
          <Button
            disabled={number === 1}
            onClick={() => setNumber((n) => n - 1)}
          >
            Anterior
          </Button>
          <span>Página {number}</span>
          <Button
            disabled={!resource.data?.length}
            onClick={() => setNumber((n) => n + 1)}
          >
            Siguiente
          </Button>
        </div>
      </Status>
    </>
  );
}
