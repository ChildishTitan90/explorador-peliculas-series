import { useEffect, useRef, useState } from "react";
import { accountRequest, titleIdentity } from "../services/accountApi";

const emptyLists = () => ({ favoritos: [], "quiero-ver": [], "ya-vi": [] });

export function useAccountData(user) {
  const userId = user?.id;
  const [state, setState] = useState({ userId: null, entries: [], error: "", loading: false });
  const queue = useRef(Promise.resolve());
  const loads = useRef(0);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = () => {
      const sequence = ++loads.current;
      queue.current.catch(() => {}).then(() => active ? accountRequest("entries") : null).then((data) => {
        if (!data) return;
        if (active && sequence === loads.current && data.userId === userId) setState({ ...data, error: "", loading: false });
      }).catch((error) => {
        if (active && sequence === loads.current) setState({ userId, entries: [], error: error.message, loading: false });
      });
    };
    const foreground = () => {
      if (document.visibilityState === "visible") load();
    };
    load();
    document.addEventListener("visibilitychange", foreground);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", foreground);
    };
  }, [userId]);
  const owned = userId && state.userId === userId;
  const entries = owned ? state.entries : [];
  const saved = emptyLists();
  for (const entry of entries) {
    if (entry.item.media_type === "episode") continue;
    if (entry.favorite) saved.favoritos.push(entry.item);
    if (entry.watchlist) saved["quiero-ver"].push(entry.item);
    if (entry.watchedAt) saved["ya-vi"].push(entry.item);
  }
  function mutate(action, body) {
    loads.current++;
    const operation = queue.current.catch(() => {}).then(async () => {
      const data = await accountRequest(action, { ...body, userId });
      if (data.userId !== userId) throw new Error("La cuenta cambió. Recarga tus datos.");
      setState((previous) => previous.userId === userId
        ? { ...data, error: "", loading: false } : previous);
      return data;
    });
    queue.current = operation;
    // A failed write is reported to its caller; the queue stays usable.
    queue.current.catch(() => {});
    return operation;
  }
  async function setList(list, item, enabled) {
    try {
      await mutate("list", { list, title: titleIdentity(item), enabled });
    } catch (error) {
      setState((previous) => previous.userId === userId ? { ...previous, error: error.message } : previous);
    }
  }
  return {
    user, entries, saved,
    loading: Boolean(userId && !owned),
    error: owned ? state.error : "",
    setList,
    saveRating: (item, rating) => mutate("rating", { title: titleIdentity(item), ...rating }),
    removeRating: (item) => mutate("rating", { title: titleIdentity(item), remove: true }),
  };
}
