import { useEffect, useRef, useState } from "react";
import { href, imageUrl, keyOf } from "../presentation/moviePresentation";
import { people } from "./socialDemoData";

import { matchesFor, drawRound, needsPlanResponse } from "../application/useSharedPlans";
const me = "pablo";
const nameOf = (id) => people.find((person) => person.id === id)?.name || id;

function Roulette({ plan, animate, onClose, onAccept, onPass }) {
  const dialog = useRef(null);
  const stage = useRef(null);
  const skip = useRef(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const modal = dialog.current;
    modal.showModal();
    const cards = [...stage.current.children];
    const winner = plan.reel.findIndex((item) => keyOf(item) === keyOf(plan.item));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    let frame;
    function paint(now) {
      const progress = !animate || reduced || skip.current ? 1 : Math.min(1, (now - started) / 1900);
      const turnsLeft = 1.65 * (1 - progress) ** 2;
      cards.forEach((card, i) => {
        const angle = 2 * Math.PI * ((i - winner) / cards.length + turnsLeft);
        const depth = (1 + Math.cos(angle)) / 2;
        const x = Math.sin(angle) * 0.96 + (1 - depth) * 0.42;
        card.style.transform = "translate(-50%, -50%) translateX(" + x * 100 + "%) rotateY(" +
          (-20 * Math.sin(angle)) + "deg) scale(" + (0.65 + 0.35 * depth) + ")";
        card.style.zIndex = Math.round(depth * 100);
        card.style.opacity = 0.38 + depth * 0.62;
      });
      if (progress < 1) frame = requestAnimationFrame(paint);
      else setRevealed(true);
    }
    frame = requestAnimationFrame(paint);
    return () => { cancelAnimationFrame(frame); modal.close(); };
  }, [plan.reel, plan.item, animate]);

  return <dialog className="roulette-dialog" ref={dialog} aria-label="Ruleta de planes juntos"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <button className="roulette-close" aria-label="Cerrar ruleta" onClick={onClose}>×</button>
    <h2>{revealed ? "Su elección" : "Eligiendo qué ver juntos"}</h2>
    <div className="roulette-stage" ref={stage} aria-hidden="true">
      {plan.reel.map((item) => <div className="roulette-poster" key={keyOf(item)}>
        <img className={revealed && keyOf(item) === keyOf(plan.item) ? "winner" : ""}
          src={imageUrl(item.poster_path || item.backdrop_path, "w500")} alt="" />
      </div>)}
    </div>
    <div className="roulette-result" aria-live="polite">{revealed && plan.item.title}</div>
    {revealed ? <div className="roulette-votes">
      <button className="button roulette-accept" onClick={onAccept}>Aceptar</button>
      <button className="button glass" onClick={onPass}>Elegir otra</button>
    </div> : <button className="button glass" onClick={() => { skip.current = true; }}>Saltar animación</button>}
  </dialog>;
}

function PlanCard({ plan, save, pending }) {
  const [actor, setActor] = useState(me);
  const other = actor === me ? plan.friend : me;
  const pool = matchesFor(plan.friend, pending, plan.type);
  const [reopened, setReopened] = useState(false);
  const awaitingVote = plan.state === "vote" && !plan.votes.includes(actor);
  const seen = plan.seen.includes(actor);
  const showRoulette = awaitingVote && (!seen || reopened);
  function closeRoulette() {
    setReopened(false);
    if (!seen) save({ ...plan, seen: [...plan.seen, actor] });
  }
  function pass() {
    setReopened(false);
    save(drawRound({ ...plan, passed: [...plan.passed, keyOf(plan.item)] }, pool));
  }
  function vote() {
    setReopened(false);
    const votes = [...new Set([...plan.votes, actor])];
    save({ ...plan, votes, state: votes.length === 2 ? "agreed" : "vote" });
  }
  function watched() {
    const marks = [...new Set([...plan.watched, actor])];
    save({ ...plan, watched: marks, state: marks.length === 2 ? "complete" : "agreed" });
  }
  const action = (text, click) => <button className="button glass" onClick={click}>{text}</button>;
  return <article className="plan-card">
    <header><strong>{plan.type === "tv" ? "Serie" : "Película"} · Pablo y {nameOf(plan.friend)}</strong>
      <label>Demo · responder como <select value={actor} onChange={(e) => setActor(e.target.value)}>
        {[me, plan.friend].map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
      </select></label>
    </header>
    {plan.state === "invited" && <><p>{needsPlanResponse(plan, actor) ? nameOf(other) + " te invita a elegir qué ver juntos." : "Invitación enviada. Esperando a " + nameOf(other) + "."}</p>
      {needsPlanResponse(plan, actor) && action("Aceptar invitación", () => save(drawRound(plan, pool)))}</>}
    {showRoulette && <Roulette key={actor + plan.round} plan={plan} animate={!seen && plan.reel.length > 1}
      onClose={closeRoulette} onAccept={vote} onPass={pass} />}
    {["vote", "agreed", "complete"].includes(plan.state) && !showRoulette && <div className="plan-choice" aria-live="polite">
      <img src={imageUrl(plan.item.poster_path || plan.item.backdrop_path, "w185")} alt="" />
      <div><a href={href(plan.item)}>{plan.item.title} ↗</a>
      {plan.state === "vote" && <p>{plan.votes.includes(actor) ? "Aceptaste. Esperando a " + nameOf(other) + "." : plan.votes.includes(other) ? nameOf(other) + " ya aceptó. ¿Te apuntas?" : "¿Quieren ver este título?"}</p>}
      {plan.state === "agreed" && <p>{plan.watched.includes(actor) ? "Esperando que " + nameOf(other) + " confirme que ya la vio." : "Ambos aceptaron este plan."}</p>}
      {plan.state === "complete" && <p>Plan completado · Ambos la vieron.</p>}</div>
    </div>}
    {awaitingVote && !showRoulette && action("Retomar votación", () => setReopened(true))}
    {plan.state === "exhausted" && <><p>Se agotaron las coincidencias. Añadan títulos a Quiero ver o vuelvan a incluir los descartados.</p>
      {pool.some((i) => !plan.passed.includes(keyOf(i))) && action("Sortear títulos nuevos", () => save(drawRound(plan, pool)))}
      {pool.length > 0 && action("Incluir descartados", () => save(drawRound({ ...plan, passed: [] }, pool)))}</>}
    {plan.state === "agreed" && !plan.watched.includes(actor) && action("Ya la vimos", watched)}
    {plan.state !== "complete" && action(plan.state === "invited" && needsPlanResponse(plan, actor) ? "Rechazar invitación" : "Cancelar plan", () => save({ ...plan, state: "cancelled" }))}
  </article>;
}

export default function SharedPlans({ store, pending, friend }) {
  const plans = store.plans.filter((p) => !friend || p.friend === friend).reverse().sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const groups = [
    ["Planes actuales", plans.filter((p) => !["invited", "complete"].includes(p.state)), "Sin planes en curso."],
    ["Solicitudes enviadas y recibidas", plans.filter((p) => p.state === "invited"), "Sin solicitudes pendientes."],
    ["Vistas en planes", plans.filter((p) => p.state === "complete"), "Aquí aparecerán los títulos cuando ambos confirmen que los vieron."],
  ];
  return <section className="shared-plans">
    <h2>Planes juntos</h2>
    {groups.flatMap(([heading, entries, empty]) => [
      <h3 key={heading}>{heading}</h3>,
      ...(entries.length ? entries.map((p) => <PlanCard key={p.id ?? (p.friend + ":" + p.type)} plan={p} pending={pending} save={store.save} />) : [<p key={empty}>{empty}</p>]),
    ])}
    {store.error && <p role="status">Este navegador solo pudo conservar los cambios durante esta visita.</p>}
  </section>;
}

