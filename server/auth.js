import { randomBytes, createHash } from "node:crypto";
import argon2 from "argon2";
import { getPostgres } from "./databases.js";

const cookieName = "cinepollis_session";
const lifetime = 7 * 24 * 60 * 60;
const passwordOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
const testSiteKey = "1x00000000000000000000AA";
const testSecret = "1x0000000000000000000000000000000AA";
const deployed = () => Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
const testingCaptcha = () => !deployed() && process.env.AUTH_TEST_CAPTCHA === "true";
let dummyHash;

export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function originAllowed(request) {
  const allowed = [process.env.APP_ORIGIN];
  if (process.env.VERCEL_URL) allowed.push("https://" + process.env.VERCEL_URL);
  if (!deployed()) allowed.push("http://localhost:5173", "http://127.0.0.1:5173");
  return allowed.filter(Boolean).includes(request.headers.origin);
}

function captchaSettings() {
  if (testingCaptcha()) return { siteKey: testSiteKey, secret: testSecret, testing: true };
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!siteKey || !secret || /^[123]x0{10,}/.test(siteKey) || /^[123]x0{10,}/.test(secret)) {
    fail(503, "El acceso todavía no está configurado. Intenta más tarde.");
  }
  return { siteKey, secret, testing: false };
}

async function verifyCaptcha(request, body, action) {
  const settings = captchaSettings();
  if (typeof body.captchaToken !== "string" || !body.captchaToken || body.captchaToken.length > 2048) {
    fail(400, "Completa la verificación de seguridad.");
  }
  let result;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: settings.secret, response: body.captchaToken }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("CAPTCHA_UNAVAILABLE");
    result = await response.json();
  } catch {
    fail(503, "No pudimos comprobar el CAPTCHA. Intenta nuevamente.");
  }
  const expectedHost = new URL(request.headers.origin).hostname;
  if (!result.success || (!settings.testing && (result.hostname !== expectedHost || result.action !== action))) {
    fail(400, "La verificación de seguridad venció o falló. Complétala nuevamente.");
  }
}

export async function readBody(request) {
  if (!request.headers["content-type"]?.startsWith("application/json")) {
    fail(415, "Envía los datos como JSON.");
  }
  let data = request.body;
  if (data !== undefined && typeof data !== "string") data = JSON.stringify(data);
  if (data === undefined) {
    data = "";
    for await (const chunk of request) {
      data += chunk;
      if (Buffer.byteLength(data) > 16384) fail(413, "La solicitud es demasiado grande.");
    }
  }
  if (Buffer.byteLength(data) > 16384) fail(413, "La solicitud es demasiado grande.");
  try {
    const body = JSON.parse(data);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    fail(400, "Revisa los datos del formulario.");
  }
}

function credentials(body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body.password;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || typeof password !== "string" || !password.length || Buffer.byteLength(password) > 512) {
    fail(400, "Revisa el correo y la contraseña.");
  }
  return { email, password };
}

export function tokenDigest(request) {
  const cookie = request.headers.cookie?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(cookieName + "="));
  const token = cookie?.slice(cookieName.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return createHash("sha256").update(token).digest();
}

function setCookie(response, token, maxAge) {
  response.setHeader("Set-Cookie",
    cookieName + "=" + token + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" + maxAge
    + (deployed() ? "; Secure" : ""));
}

export async function currentUser(request) {
  const digest = tokenDigest(request);
  if (!digest) return null;
  const result = await getPostgres().query(
    `SELECT u.id,u.username,u.display_name FROM cinepollis.login_sessions s
     JOIN cinepollis.users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>clock_timestamp()`,
    [digest],
  );
  return result.rows[0] || null;
}

async function register(request, body) {
  const { email, password } = credentials(body);
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!/^[a-z0-9_]{3,24}$/.test(username) || !displayName || displayName.length > 60) {
    fail(400, "Usa un nombre de hasta 60 caracteres y un usuario de 3 a 24 letras, números o guiones bajos.");
  }
  if ([...password].length < 12) fail(400, "Usa una contraseña de al menos 12 caracteres.");
  await verifyCaptcha(request, body, "register");
  const hash = await argon2.hash(password, passwordOptions);
  try {
    await getPostgres().query(
      "INSERT INTO cinepollis.users(username,display_name,email,password_hash) VALUES($1,$2,$3,$4)",
      [username, displayName, email, hash],
    );
  } catch (error) {
    if (error.code === "23505") fail(409, "No pudimos registrar esos datos. Prueba con otro correo o usuario.");
    throw error;
  }
  return { message: "Cuenta creada. Ya puedes iniciar sesión." };
}

async function login(request, response, body) {
  const { email, password } = credentials(body);
  await verifyCaptcha(request, body, "login");
  const client = await getPostgres().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT id,username,display_name,password_hash,login_blocked_until FROM cinepollis.users WHERE lower(email)=$1 FOR UPDATE",
      [email],
    );
    const account = rows[0];
    if (account?.login_blocked_until && account.login_blocked_until > new Date()) {
      await client.query("COMMIT");
      fail(429, "Acceso bloqueado temporalmente. Intenta después de 15 minutos desde el último bloqueo.");
    }
    dummyHash ||= argon2.hash(randomBytes(32), passwordOptions);
    const valid = await argon2.verify(account?.password_hash || await dummyHash, password);
    if (!account || !account.password_hash || !valid) {
      let blockedUntil;
      if (account) {
        const failure = await client.query("SELECT cinepollis.register_login_failure($1) AS blocked_until", [account.id]);
        blockedUntil = failure.rows[0].blocked_until;
      }
      await client.query("COMMIT");
      if (blockedUntil) fail(429, "Cinco intentos incorrectos. Espera 15 minutos para volver a entrar.");
      fail(401, "Correo o contraseña incorrectos.");
    }
    const token = randomBytes(32).toString("hex");
    const digest = createHash("sha256").update(token).digest();
    const result = await client.query(
      "SELECT * FROM cinepollis.start_login_session($1,$2,clock_timestamp()+interval '7 days')",
      [account.id, digest],
    );
    await client.query("COMMIT");
    if (result.rows[0].outcome === "session_active") {
      fail(409, "Tu cuenta está en uso en otro dispositivo. Cierra allí la sesión o espera cinco minutos sin actividad.");
    }
    if (result.rows[0].outcome !== "created") fail(429, "El acceso está bloqueado temporalmente.");
    setCookie(response, token, lifetime);
    return { user: { id: account.id, username: account.username, display_name: account.display_name } };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export default async function auth(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  const action = new URL(request.url, "http://localhost").pathname.split("/").pop();
  try {
    let result;
    if (request.method === "GET" && action === "config") {
      const settings = captchaSettings();
      result = { siteKey: settings.siteKey, testing: settings.testing };
    } else if (request.method === "GET" && action === "me") {
      result = { user: await currentUser(request) };
    } else if (request.method === "POST" && ["register", "login", "logout", "heartbeat"].includes(action)) {
      if (!originAllowed(request)) fail(403, "Origen de solicitud no permitido.");
      if (action === "register") result = await register(request, await readBody(request));
      if (action === "login") result = await login(request, response, await readBody(request));
      if (action === "logout") {
        const digest = tokenDigest(request);
        if (digest) await getPostgres().query("DELETE FROM cinepollis.login_sessions WHERE token_hash=$1", [digest]);
        setCookie(response, "", 0);
        result = { ok: true };
      }
      if (action === "heartbeat") {
        const digest = tokenDigest(request);
        if (!digest) fail(401, "La sesión terminó. Vuelve a entrar.");
        const { rows } = await getPostgres().query("SELECT cinepollis.touch_login_session($1) AS id", [digest]);
        if (!rows[0].id) fail(401, "La sesión terminó. Vuelve a entrar.");
        result = { ok: true };
      }
    } else {
      fail(405, "Método o ruta no admitidos.");
    }
    response.statusCode = 200;
    response.end(JSON.stringify(result));
  } catch (error) {
    response.statusCode = error.status || 503;
    response.end(JSON.stringify({ error: error.status ? error.message : "El servicio no está disponible. Intenta más tarde." }));
  }
}
