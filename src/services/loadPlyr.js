let loading;
export function loadPlyr() {
  if (window.Plyr) return Promise.resolve(window.Plyr);
  if (!document.querySelector("link[data-plyr-style]")) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://cdn.plyr.io/3.8.5/plyr.css";
    style.dataset.plyrStyle = "";
    document.head.append(style);
  }
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.plyr.io/3.8.5/plyr.js";
      script.onload = () => resolve(window.Plyr);
      script.onerror = () => {
        script.remove();
        loading = undefined;
        reject(new Error("No se pudo cargar Plyr."));
      };
      document.head.append(script);
    });
  }
  return loading;
}
