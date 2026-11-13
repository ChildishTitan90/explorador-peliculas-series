import { useState } from "react";
import "./social.css";
import { people } from "./socialDemoData";
import { useDemoEntries } from "../application/useDemoEntries";
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
        <Stars value={entry.score} />
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
function ActivityCard({ entry }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <article className="activity-card glass">
      <a
        href={`#/${entry.kind === "movie" ? "pelicula" : "serie"}/${entry.seriesId || entry.tmdbId}`}
      >
        <img src={`/images/${entry.image}.jpg`} alt="" />
        <h3>{entry.title}</h3>
      </a>
      <div className="activity-card-content">
        <PersonLink id={entry.user} />
        <Stars value={entry.score} />
        {entry.review && (
          <div className="activity-review">
            {entry.spoiler && !revealed ? (
              <button
                type="button"
                className="spoiler-button"
                onClick={() => setRevealed(true)}
              >
                Contiene spoilers · Mostrar crítica
              </button>
            ) : (
              <p>{entry.review}</p>
            )}
          </div>
        )}
        <small>
          Calificación de {getPerson(entry.user).name} ·{" "}
          {new Date(entry.date).toLocaleDateString("es-MX")}
        </small>
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
export default function SocialViews({ page, username, scope }) {
  const [following, setFollowing] = useState(["ana"]);
  const [entries] = useDemoEntries();
  const [tab, setTab] = useState("calificadas");
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("Pablo");
  const [bio, setBio] = useState(people[0].bio);
  if (page === "acceso")
    return (
      <section className="social-access glass">
        <p className="eyebrow">TU CÍRCULO DE CINE</p>
        <h1>Las historias se disfrutan más juntos.</h1>
        <p>Califica, descubre lo que ven los demás y crea tu perfil.</p>
        <button className="button light" disabled>
          Continuar con Google · Próximamente
        </button>
        <p>
          El registro estará abierto. Por ahora puedes explorar todas las
          pantallas sin iniciar sesión.
        </p>
        <a href="#/actividad">Ver demostración de la comunidad →</a>
        <DemoNote />
      </section>
    );
  if (page === "perfil") {
    const person = getPerson(username) || people[0];
    const own = person.id === "pablo";
    const mine = entries.filter((e) => e.user === person.id);
    const avg = mine.length
      ? mine.reduce((n, e) => n + e.score, 0) / mine.length
      : null;
    return (
      <section className="social-profile">
        <div className="profile-glow" />
        <DemoNote />
        <header className="profile-heading">
          <Avatar person={person} large />
          <div>
            <p className="eyebrow">SU VIDA EN HISTORIAS</p>
            <h1>{own ? displayName : person.name}</h1>
            <p>@{person.id}</p>
            <p>{own ? bio : person.bio}</p>
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
        <div className="profile-stats glass">
          <div>
            <strong>{mine.filter((e) => e.kind === "movie").length}</strong>
            <span>Películas vistas</span>
          </div>
          <div>
            <strong>{mine.filter((e) => e.kind === "episode").length}</strong>
            <span>Episodios vistos</span>
          </div>
          <div>
            <strong>{avg === null ? "—" : avg.toFixed(1)}</strong>
            <span>Promedio / 5</span>
          </div>
          <a href={`#/personas/${person.id}/seguidores`}>
            <strong>{person.id === "ana" ? 1 : 0}</strong>
            <span>Seguidores</span>
          </a>
          <a href={`#/personas/${person.id}/seguidos`}>
            <strong>{own ? following.length : 0}</strong>
            <span>Siguiendo</span>
          </a>
        </div>
        <div className="chips">
          {["calificadas", "quiero ver", "favoritos"].map((label) => (
            <button
              key={label}
              className={`chip ${tab === label ? "active" : ""}`}
              onClick={() => setTab(label)}
            >
              {label === "calificadas" ? "Vistas y calificadas" : label}
            </button>
          ))}
        </div>
        {tab === "calificadas" ? (
          <div className="social-grid">
            {mine.length ? (
              mine.map((e) => <ActivityCard key={e.id} entry={e} />)
            ) : (
              <p>Todavía no hay calificaciones.</p>
            )}
          </div>
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
        {(scope === "seguidos" ? following : ["ana"]).map((id) => (
          <div className="people-row glass" key={id}>
            <PersonLink id={id} />
            <a href={`#/perfil/${id}`}>Ver perfil →</a>
          </div>
        ))}
      </>
    );
  const all = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const rows = scope
    ? [
        scope === "siguiendo"
          ? {
              title: "Las personas que sigues",
              slug: "siguiendo",
              items: all.filter((e) => following.includes(e.user)),
            }
          : {
              title: "Historias de toda la comunidad",
              slug: "todos",
              items: all,
            },
      ]
    : [
        { title: "Historias de toda la comunidad", slug: "todos", items: all },
        {
          title: "Las personas que sigues",
          slug: "siguiendo",
          items: all.filter((e) => following.includes(e.user)),
        },
      ];
  return (
    <section className="social-activity">
      <div className="profile-glow" />
      <DemoNote />
      <div className="page-heading">
        <p className="eyebrow">CINE EN COMPAÑÍA</p>
        <h1>
          Descubre historias.
          <br />
          Encuentra a tu gente.
        </h1>
        <p>
          Lo último que calificó la comunidad, con la mirada de cada persona.
        </p>
      </div>
      {rows.map((row) => (
        <section className="activity-section" key={row.slug}>
          <div className="section-heading">
            <h2>{row.title}</h2>
            <a href={`#/actividad/${row.slug}`}>Ver todo →</a>
          </div>
          <p className="social-caption">
            {row.slug === "todos"
              ? "Todos los perfiles, incluidos los que aún no sigues."
              : "Solo las personas que elegiste seguir."}{" "}
            · Más recientes primero
          </p>
          <div className={scope ? "social-grid" : "activity-carousel"}>
            {row.items.map((e) => (
              <ActivityCard key={e.id} entry={e} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
export function SocialRatingPanel({ item, type }) {
  const [entries, setEntries] = useDemoEntries();
  const [section, setSection] = useState("notas");
  const [notice, setNotice] = useState("");
  const [episode, setEpisode] = useState(1);
  const relevant = entries.filter((e) =>
    type === "tv"
      ? e.seriesId === item.id && e.episode === episode
      : e.kind === "movie" && e.tmdbId === item.id,
  );
  const mine = relevant.find((e) => e.user === "pablo");
  function save({ score, review, spoiler }) {
    const existing = mine;
    const entry = {
      id: existing?.id || `demo-${item.id}-${episode}`,
      user: "pablo",
      kind: type === "tv" ? "episode" : "movie",
      tmdbId: type === "tv" ? 1343402 + episode : item.id,
      seriesId: type === "tv" ? item.id : undefined,
      season: 1,
      episode,
      title: type === "tv" ? `${item.title} · T1 · E${episode}` : item.title,
      image:
        type === "tv"
          ? "dark"
          : {
              438631: "dune-bg",
              152601: "her",
              329865: "arrival",
              335984: "blade",
            }[item.id] || "interstellar-bg",
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
          .slice(0, section === "notas" ? 3 : 20)
          .map((e) => (
            <Review
              key={`${e.id}-${e.review}`}
              entry={section === "criticas" ? e : { ...e, review: "" }}
            />
          ))}
      </div>
      {!relevant.length && (
        <p className="social-caption">
          Sé la primera persona en compartir tu mirada.
        </p>
      )}
      <button className="button glass" onClick={() => setSection("criticas")}>
        Ver todas las críticas
      </button>
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
