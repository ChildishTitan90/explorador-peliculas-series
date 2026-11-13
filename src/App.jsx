import SocialViews from "./social/SocialViews";
import Icon from "./components/Icon";
import { Brand } from "./components/ui";
import { NAV } from "./presentation/moviePresentation";
import { Home, Catalog, Detail, Modal } from "./application/controllers";
import { useAppController } from "./application/useAppController";
import CollectionScreen from "./screens/CollectionScreen";
import "./App.css";
export default function App() {
  const {
    route,
    saved,
    toggle,
    modal,
    setModal,
    storageError,
    page,
    query,
    detail,
    active,
  } = useAppController();
  return (
    <div className={`app ${detail ? "detail-page" : ""}`}>
      <a
        className="skip-link"
        href="#contenido"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("contenido").focus();
        }}
      >
        Saltar al contenido
      </a>
      <header className="header">
        <Brand />
        <nav className="desktop-nav glass" aria-label="Navegación principal">
          {NAV.map(([label, slug]) => (
            <a
              key={slug}
              className={active === slug ? "active" : ""}
              aria-current={active === slug ? "page" : undefined}
              href={`#/${slug}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          href="#/explorar"
          className="icon-button glass"
          aria-label="Buscar por título"
        >
          <Icon name="search" />
        </a>
        <div className="social-nav-links">
          <a href="#/actividad">Actividad</a>
          <a href="#/acceso">Entrar</a>
          <a
            className="profile-entry"
            href="#/perfil/pablo"
            aria-label="Ver perfil de demostración"
          >
            P
          </a>
        </div>
      </header>
      <main id="contenido" tabIndex="-1">
        {["actividad", "perfil", "acceso", "personas"].includes(page) ? (
          <SocialViews
            key={`${page}:${route.id}`}
            page={page}
            username={route.id}
            scope={page === "personas" ? route.section : route.id}
          />
        ) : !page ? (
          <Home {...{ saved, toggle }} />
        ) : ["explorar", "peliculas", "series"].includes(page) ? (
          <Catalog
            key={`${page}:${query}`}
            {...{ page, query, saved, toggle }}
          />
        ) : ["favoritos", "quiero-ver", "ya-vi"].includes(page) ? (
          <CollectionScreen {...{ page, saved, toggle }} />
        ) : detail && /^\d+$/.test(route.id) ? (
          <Detail
            key={`${page}:${route.id}`}
            type={page === "serie" ? "tv" : "movie"}
            id={route.id}
            {...{ saved, toggle }}
            openModal={(kind, item) => setModal({ kind, item })}
          />
        ) : (
          <div className="empty">
            <h1>Esta historia no está aquí.</h1>
            <a className="button light" href="#/">
              Volver al inicio
            </a>
          </div>
        )}
      </main>
      {storageError && (
        <p className="storage-warning" role="status">
          El navegador no pudo guardar tu colección. Los cambios durarán durante
          esta visita.
        </p>
      )}
      <footer>
        <Brand />
        <span>Historias que se quedan contigo.</span>
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
          Datos de TMDb
        </a>
        <small>
          Este producto utiliza la API de TMDb, pero TMDb no lo respalda ni
          certifica.
        </small>
      </footer>
      <nav className="mobile-nav glass" aria-label="Navegación móvil">
        {NAV.map(([label, slug, icon]) => (
          <a
            key={slug}
            className={active === slug ? "active" : ""}
            aria-current={active === slug ? "page" : undefined}
            href={`#/${slug}`}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      {modal && <Modal modal={modal} close={() => setModal(null)} />}
    </div>
  );
}
