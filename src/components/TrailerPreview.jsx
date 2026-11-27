import { useEffect, useEffectEvent, useRef, useState } from "react";
import { loadPlyr } from "../services/loadPlyr";

export default function TrailerPreview({ video, title, start = 20, revealDelayMs = 5600, onStop, position }) {
  const host = useRef(null);
  const [playing, setPlaying] = useState(false);
  const stop = useEffectEvent((reason) => {
    setPlaying(false);
    onStop?.(reason);
  });

  useEffect(() => {
    let active = true;
    let player;
    let reveal;
    const target = document.createElement("div");
    target.dataset.plyrProvider = "youtube";
    target.dataset.plyrEmbedId = video;
    const mount = host.current;
    mount.append(target);
    const watchdog = setTimeout(() => { if (active) stop("blocked"); }, 15000);
    loadPlyr().then((Plyr) => {
      if (!active) return;
      player = new Plyr(target, {
        title, controls: [], ratio: "16:9", muted: true,
        playsinline: true, clickToPlay: false, loadSprite: false,
        keyboard: { focused: false, global: false },
        storage: { enabled: false },
        youtube: {
          noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3,
          modestbranding: 1, controls: 0, disablekb: 1,
          start: Math.floor(position?.current || start),
        },
      });
      player.on("ready", () => {
        if (!active) return;
        player.muted = true;
        player.play()?.catch(() => { if (active) stop("blocked"); });
      });
      player.on("playing", () => {
        if (!active) return;
        clearTimeout(watchdog);
        clearTimeout(reveal);
        reveal = setTimeout(() => setPlaying(true), revealDelayMs);
      });
      player.on("ended", () => { if (active) stop("ended"); });
      player.on("pause", () => { if (active) stop("paused"); });
      player.on("error", () => { if (active) stop("unavailable"); });
    }).catch(() => { if (active) stop("blocked"); });
    return () => {
      active = false;
      clearTimeout(watchdog);
      clearTimeout(reveal);
      if (position && player?.ready) position.current = player.currentTime || 0;
      player?.destroy();
      mount.replaceChildren();
    };
  }, [video, title, start, position, revealDelayMs]);

  return <div ref={host} className={`trailer-preview${playing ? " playing" : ""}`} aria-hidden="true" />;
}
