import { useAccount } from "../application/AccountContext";

export default function AccountScreen() {
  const account = useAccount();
  if (!account.user) return <section className="social-profile"><h1>Tu cuenta</h1><a href="#/acceso">Inicia sesión para ver tus historias.</a></section>;
  const ratings = account.entries.filter((entry) => entry.score !== null);
  return <section className="social-profile">
    <h1>{account.user.display_name}</h1>
    <p>@{account.user.username}</p>
    <div className="chips">
      <a className="chip" href="#/favoritos">Favoritos</a>
      <a className="chip" href="#/quiero-ver">Quiero ver</a>
      <a className="chip" href="#/ya-vi">Ya vi</a>
      <a className="chip" href="#/acceso">Mi sesión</a>
    </div>
    <h2>Tus calificaciones</h2>
    {account.loading && <p role="status">Cargando tus calificaciones…</p>}
    {!account.loading && !account.error && !ratings.length && <p>Aún no has guardado calificaciones. Abre una película o un episodio para calificarlo.</p>}
    {ratings.map((entry) => {
      const episode = entry.item.media_type === "episode";
      const link = "#/" + (entry.item.media_type === "movie" ? "pelicula/" : "serie/")
        + (episode ? entry.item.seriesId : entry.item.id) + "?critica=" + entry.id;
      return <article className="review-row glass" key={entry.id}>
        <h3><a href={link}>{entry.item.title}</a></h3>
        {episode && <p>Temporada {entry.item.season} · Episodio {entry.item.episode}</p>}
        <p>{entry.score}/5</p>
        {entry.review && <p>{entry.spoiler ? "Tu crítica contiene spoilers." : entry.review}</p>}
        <a href={link}>Ver o editar mi calificación</a>
      </article>;
    })}
  </section>;
}
