import { useEffect, useRef } from "react";
import Icon from "./Icon";
import { Button } from "./ui";
export default function ModalView({
  modal,
  close,
  video,
  url,
  copied,
  copyError,
  onCopy,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const controls = ref.current.querySelectorAll("button,a,input,iframe");
        const first = controls[0],
          last = controls[controls.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [close]);
  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={ref}
        tabIndex="-1"
        className={`modal ${modal.kind === "share" ? "share-modal glass" : "trailer-modal"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="icon-button glass modal-close"
          onClick={close}
          aria-label="Cerrar"
        >
          <Icon name="close" />
        </button>
        {modal.kind === "trailer" ? (
          <>
            {video ? (
              <iframe
                title={`Tráiler de ${modal.item.title}`}
                src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&rel=0`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="trailer-unavailable">
                <Icon name="film" />
                <p>Este título todavía no tiene un tráiler disponible.</p>
              </div>
            )}
            <h2 id="modal-title">{modal.item.title} · Tráiler oficial</h2>
          </>
        ) : (
          <>
            <h2 id="modal-title">Las buenas historias se comparten.</h2>
            <p>Envía {modal.item.title} a alguien que también ame el cine.</p>
            <input
              aria-label="Enlace para compartir"
              readOnly
              value={url}
              onFocus={(event) => event.target.select()}
            />
            <Button light icon={copied ? "check" : "copy"} onClick={onCopy}>
              {copied ? "Enlace copiado" : "Copiar enlace"}
            </Button>
            <p role="status">
              {copyError
                ? "Selecciona el enlace y cópialo manualmente."
                : copied
                  ? "Listo para compartir."
                  : ""}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
