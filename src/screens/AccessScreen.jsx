import { useEffect, useState } from "react";
import { authRequest } from "../services/authApi";
import Captcha from "../components/Captcha";
import "./AccessScreen.css";

export default function AccessScreen({ auth }) {
  const [mode, setMode] = useState("login");
  const [config, setConfig] = useState(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    authRequest("config").then((data) => {
      if (active) setConfig(data);
    }).catch((failure) => {
      if (active) setError(failure.message);
    });
    return () => { active = false; };
  }, []);
  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "register") {
        const data = await authRequest("register", { ...body, captchaToken });
        setMessage(data.message);
        setMode("login");
      } else {
        await auth.login({ ...body, captchaToken });
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
      setCaptchaToken("");
      setAttempt((value) => value + 1);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try { await auth.logout(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  if (auth.loading) return <p className="status" role="status">Comprobando tu sesión…</p>;
  if (auth.user) return (
    <section className="access-screen glass">
      <h1>Hola, {auth.user.display_name}</h1>
      <p>@{auth.user.username}</p>
      <p>Tu sesión está abierta.</p>
      <p><a href="#/cuenta">Ver mis listas y calificaciones</a></p>
      <button className="button light" disabled={busy} onClick={logout}>Cerrar sesión</button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
  return (
    <section className="access-screen glass">
      <h1>{mode === "login" ? "Entrar a Cinepollis" : "Crear tu cuenta"}</h1>
      {auth.notice && <p role="status">{auth.notice}</p>}
      <form onSubmit={submit}>
        {mode === "register" && <>
          <label>Nombre<input name="displayName" maxLength={60} required autoComplete="name" /></label>
          <label>Usuario<input name="username" minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" required autoComplete="username" /></label>
          <p className="auth-hint">De 3 a 24 letras minúsculas, números o guiones bajos.</p>
        </>}
        <label>Correo<input name="email" type="email" maxLength={254} required autoComplete="email" /></label>
        <label>Contraseña<input key={mode} name="password" type="password" minLength={mode === "register" ? 12 : 1} maxLength={128} required autoComplete={mode === "register" ? "new-password" : "current-password"} /></label>
        {mode === "register" && <p className="auth-hint">Usa al menos 12 caracteres.</p>}
        {config && <Captcha key={mode + attempt} siteKey={config.siteKey} action={mode} onToken={setCaptchaToken} onError={setError} />}
        {config?.testing && <p role="status">CAPTCHA de prueba local.</p>}
        <button className="button light" disabled={busy || !captchaToken}>
          {busy ? "Espera un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button className="button glass" disabled={busy} onClick={() => {
        setMode(mode === "login" ? "register" : "login");
        setError("");
        setMessage("");
        setCaptchaToken("");
      }}>{mode === "login" ? "Crear una cuenta" : "Ya tengo cuenta"}</button>
    </section>
  );
}
