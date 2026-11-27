import { useState } from "react";
import "./AccessScreen.css";

export default function AccessScreen({ register }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (response.status === 401) setMessage("Revisa tu correo y contraseña.");
      else if (response.status === 409) setMessage("Ese correo o nombre de usuario ya está registrado.");
      else if (!response.ok || !(response.status === 204 || response.headers.get("content-type")?.includes("application/json"))) {
        setMessage("El servicio de acceso no está disponible. Intenta más tarde.");
      } else setDone(true);
    } catch {
      setMessage("No se pudo conectar. Revisa tu conexión y vuelve a intentarlo.");
    } finally { setBusy(false); }
  }
  return <section className="access-scene">
    <div className="access-panel">
      <h1>{done ? (register ? "Cuenta creada" : "Sesión iniciada") : register ? "Crear cuenta" : "Iniciar sesión"}</h1>
      {done ? <a className="button light" href="#/">Ir al catálogo</a> : <>
        <form onSubmit={submit}>
          {register && <>
            <label>Nombre visible<input name="display_name" autoComplete="name" maxLength={60} required /></label>
            <label>Usuario<input name="username" autoComplete="username" pattern="[a-z0-9_]{3,24}" aria-describedby="username-help" required />
              <small id="username-help">De 3 a 24 letras minúsculas, números o guiones bajos.</small></label>
          </>}
          <label>Correo electrónico<input type="email" name="email" autoComplete="email" placeholder="tu@correo.com" required /></label>
          <label htmlFor="access-password">Contraseña</label>
          <div className="access-password"><input id="access-password" type={visible ? "text" : "password"} name="password"
            autoComplete={register ? "new-password" : "current-password"} required />
            <button type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setVisible(!visible)}>{visible ? "Ocultar" : "Mostrar"}</button></div>
          {message && <p role="alert">{message}</p>}
          <button className="button light" disabled={busy}>{busy ? "Un momento…" : register ? "Crear cuenta" : "Entrar"}</button>
        </form>
        <p>{register ? "¿Ya tienes cuenta?" : "¿Primera vez en Cinepollis?"} <a href={register ? "#/acceso" : "#/registro"}>{register ? "Inicia sesión" : "Crea una cuenta"}</a></p>
        <a className="access-guest" href="#/">Continuar como visitante →</a>
      </>}
    </div>
  </section>;
}
