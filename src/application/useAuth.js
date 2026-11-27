import { useEffect, useState } from "react";
import { authRequest } from "../services/authApi";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    authRequest("me").then((data) => {
      if (active) setUser(data.user);
    }).catch(() => {
      if (active) setNotice("No pudimos comprobar tu sesión. Intenta entrar nuevamente.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let lastInteraction = Date.now();
    let active = true;
    const interacted = () => { lastInteraction = Date.now(); };
    const events = ["pointerdown", "keydown", "scroll"];
    for (const event of events) window.addEventListener(event, interacted, { passive: true });
    const timer = setInterval(async () => {
      try {
        // Checking the session never extends its activity by itself.
        const data = await authRequest("me");
        if (!active) return;
        if (!data.user) {
          setUser(null);
          setNotice("Tu sesión terminó o se inició desde otro dispositivo.");
          return;
        }
        if (document.visibilityState === "visible" && Date.now() - lastInteraction < 5 * 60 * 1000) {
          await authRequest("heartbeat", {});
        }
      } catch (error) {
        if (active && error.status === 401) {
          setUser(null);
          setNotice("Tu sesión terminó. Vuelve a entrar.");
        }
      }
    }, 60000);
    return () => {
      active = false;
      clearInterval(timer);
      for (const event of events) window.removeEventListener(event, interacted);
    };
  }, [user]);

  async function login(body) {
    const data = await authRequest("login", body);
    setUser(data.user);
    setNotice("");
  }
  async function logout() {
    await authRequest("logout", {});
    setUser(null);
    setNotice("");
  }
  return { user, loading, notice, login, logout };
}
