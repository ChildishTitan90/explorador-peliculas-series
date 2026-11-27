import { useEffect, useRef } from "react";

let scriptPromise;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        script.remove();
        scriptPromise = undefined;
        reject(new Error("No pudimos cargar la verificación de seguridad."));
      };
      document.head.append(script);
    });
  }
  return scriptPromise;
}

export default function Captcha({ siteKey, action, onToken, onError }) {
  const container = useRef(null);
  useEffect(() => {
    let active = true;
    let widget;
    loadTurnstile().then((turnstile) => {
      if (!active) return;
      widget = turnstile.render(container.current, {
        sitekey: siteKey,
        action,
        theme: "dark",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => {
          onToken("");
          onError("La verificación falló. Recarga la página para intentarlo nuevamente.");
        },
      });
    }).catch((error) => {
      if (active) onError(error.message);
    });
    return () => {
      active = false;
      if (widget !== undefined) window.turnstile?.remove(widget);
    };
  }, [siteKey, action, onToken, onError]);
  return <div ref={container} className="auth-captcha" />;
}
