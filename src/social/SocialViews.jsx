import { useEffect, useRef, useState } from "react";
import "./social.css";
import { people, friendWatchlists } from "./socialDemoData";
import { useDemoEntries } from "../application/useDemoEntries";
import TitleMedia from "../components/TitleMedia";
import { useResource } from "../application/useResource";
import { request, normalize } from "../services/interfaceApi";
import { Grid, Status } from "../components/ui";
import { imageUrl } from "../presentation/moviePresentation";
import SharedPlans from "./SharedPlans";
import { matchesFor, needsPlanResponse } from "../application/useSharedPlans";
import RatingEditor from "./RatingEditor";
const getPerson = (id) => people.find((p) => p.id === id);
function Stars({ value }) {
  return (
    <span className="social-stars" aria-label={`${value} de 5 estrellas`}>
      <span aria-hidden="true">
        ★★★★★<span style={{ width: `${(value / 5) * 100}%` }}>★★★★★</span>
      </span>
      <b>
        {Number(value).toLocaleString("es-MX", { maximumFractionDigits: 2 })}/5
      </b>
    </span>
  );
}
function Avatar({ person, large = false }) {
  return (
    <span
      className={`social-avatar ${large ? "large" : ""}`}
      style={{ "--avatar-color": person.color }}
    >
      {person.name[0]}
    </span>
  );
}
function PersonLink({ id }) {
  const p = getPerson(id);
  return (
    <a className="person-link" href={`#/perfil/${id}`}>
      <Avatar person={p} />
      <span>
        {p.name}
        <small>@{p.id}</small>
      </span>
    </a>
  );
}
function Review({ entry }) {
  const [show, setShow] = useState(false);
  return (
    <article className="review-row glass">
      <div className="review-head">
        <PersonLink id={entry.user} />
        {entry.score != null && <Stars value={entry.score} />}
      </div>
      {entry.review &&
        (entry.spoiler && !show ? (
          <button className="spoiler-button" onClick={() => setShow(true)}>
            Contiene spoilers · Mostrar crítica
          </button>
        ) : (
          <p>{entry.review}</p>
        ))}
    </article>
  );
}
function ReviewExcerpt({ entry, url }) {
  const ref = useRef(null);
  const [clipped, setClipped] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setClipped(node.scrollHeight > node.clientHeight + 1),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [entry.review, entry.spoiler]);
  return (
    <a className="review-excerpt" href={url}>
      {entry.spoiler ? (
        <span>Contiene spoilers · Abrir crítica</span>
      ) : (
        <>
          <p ref={ref} className={clipped ? "clipped" : ""}>
            {entry.review}
          </p>
          {clipped && <small>Leer crítica completa →</small>}
        </>
      )}
    </a>
  );
}

function ActivityCard({ entry, companions }) {
  const film = entry.kind === "movie";
  const id = film ? entry.tmdbId : entry.seriesId;
  const url = `#/${film ? "pelicula" : "serie"}/${id}`;
  const photo = entry.backdropPath
    ? imageUrl(entry.backdropPath)
    : entry.image
      ? `/images/${entry.image}.jpg`
      : imageUrl(null);
  return (
    <article className={companions ? "activity-card shared-viewing" : "activity-card"}>
      <a
        className="activity-photo"
        href={url}
        aria-label={`Ver ${entry.title}`}
      >
        <TitleMedia
          type={film ? "movie" : "tv"}
          id={id}
          title={entry.title}
          image={photo}
          scene
        />
      </a>
      <div className="activity-card-content">
        <div className="activity-byline">
          <PersonLink id={entry.user} />
          <Stars value={entry.score} />
        </div>
        <h3>
          <a href={url}>{entry.title}</a>
        </h3>
        {companions && <p>Vista con {companions.join(", ")}</p>}
        {entry.review && (
          <ReviewExcerpt
            entry={entry}
            url={url + "?critica=" + encodeURIComponent(entry.id)}
          />
        )}
        {entry.date && <time dateTime={entry.date}>
          {new Date(entry.date).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
          })}
        </time>}
      </div>
    </article>
  );
}
function DemoNote() {
  return (
    <p className="social-demo">
      Vista previa social · personas y notas ficticias. Google y las cuentas
      reales requieren conectar el backend.
    </p>
  );
}
function FriendWatchlist({ items, saved, toggle }) {
  const resource = useResource((signal) => Promise.all(items.map(async (item) => {
    const details = await request("/" + item.media_type + "/" + item.id, {}, signal);
    return normalize(details, item.media_type);
  })), [items]);

  return (
    <Status resource={resource}>
      <Grid items={resource.data || []} saved={saved} toggle={toggle} watchlistAction />
    </Status>
  );
}

function WatchTogether({ person, saved, toggle, store, showFriendList }) {
  const [type, setType] = useState("movie");
  const shared = matchesFor(person.id, saved["quiero-ver"], type);
  const busy = store.plans.some((p) => p.friend === person.id && p.type === type && p.state !== "complete");
  return <section className="watch-together">
    <h2>Qué ver con {person.name}</h2>
    <div className="plan-actions">{[["movie","Películas"],["tv","Series"]].map(([value, label]) =>
      <button key={value} className={"chip" + (type === value ? " active" : "")} aria-pressed={type === value} onClick={() => setType(value)}>{label}</button>)}</div>
    {shared.length > 0 ? <>
      <p>{shared.length} {shared.length === 1 ? "coincidencia" : "coincidencias"} en Quiero ver.</p>
      {!busy && <button className="button light" onClick={() => store.invite(person.id, type)}>Invitar a {person.name}</button>}
    </> : <><p>Aún no tienen coincidencias de este tipo.</p><button className="button glass" onClick={showFriendList}>Ver la lista de {person.name}</button></>}
    <SharedPlans store={store} pending={saved["quiero-ver"]} friend={person.id} />
    {shared.length > 0 && <Grid items={shared} saved={saved} toggle={toggle} />}
  </section>;
}

function normalizePersonQuery(value) {
  return value.trim().toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");
}

function FriendSearch() {
  const [query, setQuery] = useState("");
  const term = normalizePersonQuery(query);
  const byHandle = term.startsWith("@");
  const needle = byHandle ? term.slice(1) : term;
  const matches = people.filter(({ id, name }) =>
    normalizePersonQuery(id).includes(needle) || (!byHandle && normalizePersonQuery(name).includes(needle))
  );
  return (
    <div className="friend-search">
      <input type="search" aria-label="Buscar personas por nombre o usuario"
        placeholder="Buscar por nombre o @usuario" value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }} />
      {term && (
        <div className="friend-results">
          {matches.length ? matches.map(({ id }) => <PersonLink key={id} id={id} />)
            : <p role="status">No encontramos personas con ese nombre o usuario.</p>}
        </div>
      )}
    </div>
  );
}

export default function SocialViews({
  planStore,
  page,
  username,
  scope,
  following,
  setFollowing,
  saved,
  toggle,
}) {

  const [entries] = useDemoEntries();
  const [tab, setTab] = useState("calificadas");
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("Pablo");
  const [bio, setBio] = useState(people[0].bio);
  const all = [...entries].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
  if (page === "perfil") {
    const person = getPerson(username) || people[0];
    const own = person.id === "pablo";
    const pendingPlanResponse = own && planStore.plans.some((plan) => needsPlanResponse(plan, person.id));
    const friendList = friendWatchlists[person.id] || [];
    const mine = all.filter((e) => e.user === person.id);
    const profileEntries = [...mine];
    const companions = new Map();
    for (const plan of [...planStore.plans].reverse()) {
      if (plan.state !== "complete" || plan.type !== "movie" || (!own && plan.friend !== person.id)) continue;
      const { item } = plan;
      const names = companions.get(item.id) || [];
      const name = own ? getPerson(plan.friend)?.name || plan.friend : displayName;
      if (!names.includes(name)) names.push(name);
      companions.set(item.id, names);
      if (!profileEntries.some((e) => e.kind === "movie" && e.tmdbId === item.id)) {
        profileEntries.push({ id: "plan-" + item.id, kind: "movie", tmdbId: item.id, title: item.title, user: person.id, backdropPath: item.backdrop_path || item.poster_path, date: plan.updatedAt });
      }
    }
    profileEntries.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
    const avg = mine.length
      ? mine.reduce((n, e) => n + e.score, 0) / mine.length
      : null;
    return (
      <section className="social-profile">
        <header className="profile-heading">
          <Avatar person={person} large />
          <div className="profile-info">
            <div className="profile-name">
              <h1>{own ? displayName : person.name}</h1>
              {own ? (
                <button
                  className="button glass"
                  onClick={() => setEditing(!editing)}
                >
                  Editar perfil · Demo
                </button>
              ) : (
                <button
                  className="button light"
                  aria-pressed={following.includes(person.id)}
                  onClick={() =>
                    setFollowing((ids) =>
                      ids.includes(person.id)
                        ? ids.filter((id) => id !== person.id)
                        : [...ids, person.id],
                    )
                  }
                >
                  {following.includes(person.id) ? "Siguiendo" : "Seguir"}
                </button>
              )}
            </div>
            <div className="profile-stats">
              <div>
                <strong>{profileEntries.filter((e) => e.kind === "movie").length}</strong>
                <span>Películas vistas</span>
              </div>
              <div>
                <strong>
                  {mine.filter((e) => e.kind === "episode").length}
                </strong>
                <span>Episodios vistos</span>
              </div>
              <div>
                <strong>{avg === null ? "—" : avg.toFixed(1)}</strong>
                <span>Promedio / 5</span>
              </div>
              <a href={`#/personas/${person.id}/seguidores`}>
                <strong>{following.includes(person.id) ? 1 : 0}</strong>
                <span>Seguidores</span>
              </a>
              <a href={`#/personas/${person.id}/seguidos`}>
                <strong>{own ? following.length : 0}</strong>
                <span>Siguiendo</span>
              </a>
            </div>
            <p>@{person.id}</p>
            <p>{own ? bio : person.bio}</p>
          </div>
        </header>
        {editing && (
          <form
            className="profile-edit glass"
            onSubmit={(e) => {
              e.preventDefault();
              setEditing(false);
            }}
          >
            <label>
              Nombre visible
              <input
                maxLength={60}
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label>
              Biografía
              <textarea
                maxLength={240}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>
            <p>
              La foto y el nombre de usuario se guardarán desde la API de
              perfiles.
            </p>
            <button className="button light">Guardar vista previa</button>
          </form>
        )}
        <div className="chips profile-tabs">
          {["calificadas", "quiero ver", "favoritos", "juntos"].map((label) => (
            <button
              key={label}
              aria-pressed={tab === label}
              className={`chip ${own && label === "juntos" ? "plans-chip" : ""} ${tab === label ? "active" : ""}`}
              aria-label={label === "juntos" && pendingPlanResponse ? "Planes juntos, respuesta pendiente" : undefined}
              onClick={() => setTab(label)}
            >
              {
                {
                  calificadas: "Vistas y calificadas",
                  "quiero ver": "Quiero ver",
                  favoritos: "Favoritos",
                  juntos: own ? "Planes juntos" : "Qué ver juntos",
                }[label]
              }
              {label === "juntos" && pendingPlanResponse && <span className="plan-notification-dot" aria-hidden="true" />}
            </button>
          ))}
        </div>
        {tab === "calificadas" ? (
          <div className="social-grid">
            {profileEntries.length ? (
              profileEntries.map((e) => <ActivityCard key={e.id} entry={e} companions={e.kind === "movie" && companions.get(e.tmdbId)} />)
            ) : (
              <p>Todavía no hay calificaciones.</p>
            )}
          </div>
        ) : tab === "juntos" && own ? (
          <SharedPlans store={planStore} pending={saved["quiero-ver"]} />
        ) : tab === "juntos" ? (
          <WatchTogether person={person} store={planStore} saved={saved} toggle={toggle} showFriendList={() => setTab("quiero ver")} />
        ) : !own && tab === "quiero ver" && friendList.length ? (
          <FriendWatchlist items={friendList} saved={saved} toggle={toggle} />
        ) : own &&
          saved[tab === "quiero ver" ? "quiero-ver" : "favoritos"].length ? (
          <Grid
            items={saved[tab === "quiero ver" ? "quiero-ver" : "favoritos"]}
            saved={saved}
            toggle={toggle}
          />
        ) : (
          <div className="empty">
            <h2>
              {tab === "quiero ver"
                ? "Sus próximas historias"
                : "Historias favoritas"}
            </h2>
            <p>
              Esta lista de demostración aún está vacía. Será pública al
              conectar las cuentas.
            </p>
          </div>
        )}
        <DemoNote />
      </section>
    );
  }
  if (page === "personas")
    return (
      <>
        <DemoNote />
        <div className="page-heading">
          <p className="eyebrow">CONEXIONES</p>
          <h1>{scope === "seguidos" ? "Personas que sigue" : "Seguidores"}</h1>
        </div>
        {(scope === "seguidos"
          ? username === "pablo"
            ? following
            : []
          : following.includes(username)
            ? ["pablo"]
            : []
        ).map((id) => (
          <div className="people-row glass" key={id}>
            <PersonLink id={id} />
            <a href={`#/perfil/${id}`}>Ver perfil →</a>
          </div>
        ))}
      </>
    );
  const latest = new Map();
  for (const entry of all) {
    if (!latest.has(entry.user)) latest.set(entry.user, Date.parse(entry.date));
  }
  const followed = [...following].sort(
    (a, b) => (latest.get(b) || 0) - (latest.get(a) || 0),
  );
  return (
    <section className="social-activity">
      <div className="activity-heading"><h1>Actividad</h1><FriendSearch /></div>
      <section className="social-following" aria-label="Perfiles que sigues">
        <h2>Siguiendo</h2>
        <div className="followed-strip">
          {followed.map((id) => (
            <PersonLink key={id} id={id} />
          ))}
          {!followed.length && (
            <p>Sigue a alguien de la comunidad para ver su perfil aquí.</p>
          )}
        </div>
      </section>
      <SharedPlans store={planStore} pending={saved["quiero-ver"]} />
      <section aria-label="Actividad de toda la comunidad">
        <h2>Reseñas de la comunidad</h2>
        <div className="social-grid">
          {all.map((entry) => (
            <ActivityCard key={entry.id} entry={entry} />
          ))}
        </div>
        {!all.length && <p>Todavía no hay notas en la comunidad.</p>}
      </section>
      <DemoNote />
    </section>
  );
}
export function SocialRatingPanel({ item, type, reviewId }) {
  const [entries, setEntries] = useDemoEntries();
  const requested = entries.find(
    (e) =>
      e.id === reviewId &&
      e.review &&
      (type === "tv"
        ? e.seriesId === item.id
        : e.kind === "movie" && e.tmdbId === item.id),
  );
  const [section, setSection] = useState(requested ? "criticas" : "notas");
  const selectedReview = useRef(null);
  useEffect(() => {
    selectedReview.current?.scrollIntoView({ block: "center" });
  }, [reviewId]);
  const [notice, setNotice] = useState("");
  const [episode, setEpisode] = useState(requested?.episode || 1);
  const relevant = entries.filter((e) =>
    type === "tv"
      ? e.seriesId === item.id && e.episode === episode
      : e.kind === "movie" && e.tmdbId === item.id,
  );
  relevant.sort(
    (a, b) =>
      Number(b.id === reviewId) - Number(a.id === reviewId) ||
      Date.parse(b.date) - Date.parse(a.date),
  );
  const mine = relevant.find((e) => e.user === "pablo");
  function save({ score, review, spoiler }) {
    const existing = mine;
    const entry = {
      id: existing?.id || `demo-${type}-${item.id}-${episode}`,
      user: "pablo",
      kind: type === "tv" ? "episode" : "movie",
      tmdbId: type === "tv" ? 1343402 + episode : item.id,
      seriesId: type === "tv" ? item.id : undefined,
      season: 1,
      episode,
      title: type === "tv" ? `${item.title} · T1 · E${episode}` : item.title,
      backdropPath: item.backdrop_path,
      score: Number(score),
      review,
      spoiler,
      date: existing?.date || new Date().toISOString(),
    };
    setEntries((old) => [...old.filter((x) => x.id !== entry.id), entry]);
    setNotice(
      "Nota de demostración guardada. Puedes verla en Actividad durante esta visita.",
    );
  }
  return (
    <section className="social-ratings">
      <div className="section-heading">
        <h2>La mirada de la comunidad</h2>
        <a href="#/acceso">Iniciar sesión →</a>
      </div>
      <div className="official-rating glass">
        <span>TMDb · promedio de su comunidad</span>
        <Stars value={Number((item.vote_average / 2).toFixed(2))} />
        <small>{item.vote_average.toFixed(1)}/10 en TMDb</small>
      </div>
      <DemoNote />
      {type === "tv" && (
        <p className="social-caption">
          Las notas de la serie y sus temporadas se calculan a partir de los
          episodios que cada persona calificó. No se puntúa la serie
          directamente.
        </p>
      )}
      <div className="chips">
        <button
          className={`chip ${section === "notas" ? "active" : ""}`}
          onClick={() => setSection("notas")}
        >
          Calificaciones
        </button>
        <button
          className={`chip ${section === "criticas" ? "active" : ""}`}
          onClick={() => setSection("criticas")}
        >
          Críticas
        </button>
      </div>
      {type === "tv" && (
        <label className="season-select">
          Episodio de ejemplo, temporada 1
          <select
            value={episode}
            onChange={(e) => {
              setEpisode(Number(e.target.value));
              setNotice("");
            }}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                Episodio {n}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="community-reviews">
        {relevant
          .filter((e) => section !== "criticas" || e.review)
          .slice(0, section === "notas" ? 3 : relevant.length)
          .map((e) => (
            <div
              key={`${e.id}-${e.review}`}
              ref={e.id === reviewId ? selectedReview : undefined}
            >
              <Review
                entry={section === "criticas" ? e : { ...e, review: "" }}
              />
            </div>
          ))}
      </div>
      {!relevant.length && (
        <p className="social-caption">
          Sé la primera persona en compartir tu mirada.
        </p>
      )}
      {section === "notas" && relevant.some((e) => e.review) && (
        <button className="button glass" onClick={() => setSection("criticas")}>
          Ver todas las críticas
        </button>
      )}
      <RatingEditor
        key={`${item.id}-${episode}`}
        mine={mine}
        onSave={save}
        onDelete={() => {
          setEntries((old) => old.filter((e) => e.id !== mine.id));
          setNotice("Nota de demostración eliminada.");
        }}
      />
      <p className="rating-notice" role="status">
        {notice}
      </p>
    </section>
  );
}
