let pending;

export function loadYouTubePlayer() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const previous = window.onYouTubeIframeAPIReady;
      const timeout = setTimeout(fail, 12000);
      function fail() {
        clearTimeout(timeout);
        script.remove();
        window.onYouTubeIframeAPIReady = previous;
        pending = undefined;
        reject(new Error("No se pudo cargar el reproductor."));
      }
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        window.onYouTubeIframeAPIReady = previous;
        resolve(window.YT);
        previous?.();
      };
      script.onerror = fail;
      script.src = "https://www.youtube.com/iframe_api";
      document.head.append(script);
    });
  }
  return pending;
}
