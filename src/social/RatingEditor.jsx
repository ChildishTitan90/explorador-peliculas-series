import { useId, useRef, useState } from "react";

export default function RatingEditor({ mine, onSave, onDelete }) {
  const [score, setScore] = useState(mine?.score ?? "");
  const [review, setReview] = useState(mine?.review || "");
  const [spoiler, setSpoiler] = useState(mine?.spoiler || false);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(null);
  const id = useId();
  const trigger = useRef(null);
  const backup = useRef(null);
  const shown = hover ?? (score === "" ? 0 : score);
  function close(cancel = false) {
    if (cancel && backup.current) {
      setReview(backup.current.review);
      setSpoiler(backup.current.spoiler);
    }
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <form
      className="rating-editor glass"
      onSubmit={(e) => {
        e.preventDefault();
        if (score === "") return;
        onSave({ score: Number(score), review: review.trim(), spoiler });
      }}
    >
      <h3>{mine ? "Tu calificación" : "¿Qué te pareció esta historia?"}</h3>
      <div
        className="rating-star-picker"
        role="group"
        aria-label="Elegir calificación"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="rating-star"
            aria-label={`Elegir ${n} estrellas; repetir para ${n - 0.5}`}
            aria-pressed={score !== "" && Math.ceil(Number(score)) === n}
            onMouseEnter={() => setHover(Number(score) === n ? n - 0.5 : n)}
            onClick={() => {
              setScore((current) => (Number(current) === n ? n - 0.5 : n));
              setHover(null);
            }}
            onKeyDown={(e) => {
              if (
                [
                  "ArrowLeft",
                  "ArrowDown",
                  "ArrowRight",
                  "ArrowUp",
                  "Home",
                  "End",
                ].includes(e.key)
              ) {
                e.preventDefault();
                setScore((current) =>
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 5
                      : Math.min(
                          5,
                          Math.max(
                            0,
                            Number(current || 0) +
                              (["ArrowLeft", "ArrowDown"].includes(e.key)
                                ? -0.5
                                : 0.5),
                          ),
                        ),
                );
                setHover(null);
              }
            }}
          >
            <span aria-hidden="true">
              ★
              <span
                style={{
                  width: `${Math.min(1, Math.max(0, shown - (n - 1))) * 100}%`,
                }}
              >
                ★
              </span>
            </span>
          </button>
        ))}
        <output aria-live="polite">
          {score === ""
            ? "Sin calificar"
            : `${score.toLocaleString("es-MX")} / 5`}
        </output>
      </div>
      <p className="rating-help">
        Elige una estrella. Pulsa otra vez la última para darle media. También
        puedes usar las flechas del teclado.
      </p>
      <div className="actions">
        <button
          type="button"
          className="chip"
          aria-pressed={score === 0}
          onClick={() => {
            setScore(0);
            setHover(null);
          }}
        >
          0 estrellas
        </button>
        <button
          ref={trigger}
          type="button"
          className="button glass"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            backup.current = { review, spoiler };
            setOpen(true);
          }}
        >
          {review ? "Editar crítica" : "Escribir crítica"}
        </button>
      </div>
      {review && !open && (
        <p className="critique-preview">
          {spoiler ? "Crítica añadida · se ocultará por spoilers" : review}
        </p>
      )}
      {open && (
        <section
          id={id}
          className="critique-composer"
          role="dialog"
          aria-labelledby={`${id}-title`}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close(true);
            }
          }}
        >
          <div className="review-head">
            <h4 id={`${id}-title`}>Tu crítica</h4>
            <button
              type="button"
              className="critique-close"
              aria-label="Cerrar recuadro de crítica"
              onClick={() => close(true)}
            >
              ×
            </button>
          </div>
          <label>
            ¿Qué te dejó esta historia?
            <textarea
              autoFocus
              maxLength={4000}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Comparte tu opinión…"
            />
          </label>
          <div className="composer-meta">
            <label className="spoiler-check">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
              />
              Ocultar por spoilers
            </label>
            <small>{review.length}/4000</small>
          </div>
          <div className="actions">
            <button
              type="button"
              className="button light"
              onClick={() => close()}
            >
              Añadir a mi nota
            </button>
            <button
              type="button"
              className="button glass"
              onClick={() => close(true)}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}
      <div className="actions">
        <button className="button light" disabled={score === ""}>
          {mine ? "Actualizar" : "Guardar"} nota · Demo
        </button>
        {mine && (
          <button
            type="button"
            className="button glass"
            onClick={() => {
              onDelete();
              setScore("");
              setReview("");
              setSpoiler(false);
              setOpen(false);
            }}
          >
            Eliminar nota
          </button>
        )}
      </div>
    </form>
  );
}
