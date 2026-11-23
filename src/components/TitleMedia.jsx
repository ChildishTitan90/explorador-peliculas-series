import { useEffect, useRef, useState } from "react";
import { loadYouTubePlayer } from "../services/youtubePlayer";
import { fetchPreview, fetchScene } from "../services/interfaceApi";

export default function TitleMedia({
  type,
  id,
  image,
  title,
  scene = false,
  children,
}) {
  const enteredAt = useRef(0);
  const videoHost = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [canReveal, setCanReveal] = useState(false);
  const [video, setVideo] = useState(null);
  const [still, setStill] = useState(null);

  useEffect(() => {
    if (!scene) return;
    const controller = new AbortController();
    fetchScene(type, id, controller.signal)
      .then((url) => {
        if (!controller.signal.aborted) setStill(url);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [type, id, scene]);

  useEffect(() => {
    if (!hovered) return;
    const controller = new AbortController();
    fetchPreview(type, id, controller.signal)
      .then((key) => {
        if (!controller.signal.aborted) setVideo(key);
      })
      .catch(() => {});
    return () => {
      controller.abort();
    };
  }, [hovered, type, id]);

  useEffect(() => {
    if (!video || !hovered) return;
    const host = videoHost.current;
    const frame = document.createElement("iframe");
    frame.title = "Avance de " + title;
    frame.src = "https://www.youtube-nocookie.com/embed/" + video +
      "?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&start=20&enablejsapi=1&origin=" +
      encodeURIComponent(location.origin);

    frame.allow = "autoplay; encrypted-media";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.tabIndex = -1;
    host.append(frame);

    let active = true;
    let timer;
    let player;
    loadYouTubePlayer().then((YT) => {
      if (!active) return;
      function update(state) {
        if (!active) return;
        if (state === YT.PlayerState.PLAYING) {
          timer ??= setTimeout(() => setCanReveal(true), Math.max(0, enteredAt.current + 500 - performance.now()));
        } else if (state !== YT.PlayerState.PAUSED && state !== YT.PlayerState.BUFFERING) {
          clearTimeout(timer);
          timer = undefined;
          setCanReveal(false);
        }
      }
      player = new YT.Player(frame, { events: {
        onReady: ({ target }) => update(target.getPlayerState()),
        onStateChange: ({ data }) => update(data),
        onError: () => update(null),
      } });
    }).catch(() => {});
    return () => {
      active = false;
      clearTimeout(timer);
      player?.destroy();
      frame.remove();
    };
  }, [hovered, video, title]);

  function stop() {
    setHovered(false);
    setCanReveal(false);
    setVideo(null);
  }

  return (
    <div
      className={`title-media${canReveal && video ? " preview-ready" : ""}`}
      onPointerEnter={(event) => {
        if (
          event.pointerType === "mouse" &&
          window.matchMedia("(any-hover: hover)").matches
        ) {
          enteredAt.current = performance.now();
          setHovered(true);
        }
      }}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      <img src={still || image} alt="" loading="lazy" />
      {hovered && video && (
        <div className="card-trailer" ref={videoHost} aria-hidden="true" />
      )}
      {children}
    </div>
  );
}
