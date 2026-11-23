import { useEffect, useState } from "react";
import { keyOf } from "../presentation/moviePresentation";
import { friendWatchlists } from "../social/socialDemoData";

const storageKey = "cinepollis.shared-plans.v1";

export function needsPlanResponse(plan, actor) {
  if (plan.state === "invited") return actor !== (plan.invitedBy ?? "pablo");
  return plan.state === "vote" && !plan.votes.includes(actor);
}

export function matchesFor(person, pending, type) {
  const keys = new Set((friendWatchlists[person] || []).map(keyOf));
  return pending.filter((item) => item.media_type === type && keys.has(keyOf(item)));
}

function readPlans() {
  try {
    const plans = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(plans) ? plans : [];
  } catch { return []; }
}

export function drawRound(plan, candidates) {
  const pool = candidates.filter((item) => !plan.passed.includes(keyOf(item)));
  if (!pool.length) return { ...plan, state: "exhausted", reel: [], votes: [], seen: [] };
  const item = pool[Math.floor(Math.random() * pool.length)];
  const reel = pool.length === 1 ? [item] : [...pool.filter((other) => keyOf(other) !== keyOf(item)), item];
  return { ...plan, state: "vote", item, reel, votes: [], seen: [], round: plan.round + 1 };
}

export function useSharedPlans() {
  const [plans, setPlans] = useState(readPlans);
  const [error, setError] = useState(false);
  useEffect(() => {
    const sync = (e) => { if (e.key === storageKey || e.key === null) setPlans(readPlans()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function save(plan) {
    const id = plan.id ?? (plan.friend + ":" + plan.type);
    const others = (error ? plans : readPlans()).filter((p) => (p.id ?? (p.friend + ":" + p.type)) !== id);
    const next = plan.state === "cancelled" ? others : [...others, { ...plan, id, updatedAt: Date.now() }];
    setPlans(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setError(false); }
    catch { setError(true); }
  }
  function invite(friend, type) {
    if (plans.some((p) => p.friend === friend && p.type === type && p.state !== "complete")) return;
    save({ id: crypto.randomUUID(), friend, type, invitedBy: "pablo", state: "invited", passed: [], votes: [], watched: [], seen: [], round: 0 });
  }
  return { plans, save, invite, error };
}

