import { useEffect, useState } from "react";
export function useResource(loader, dependencies) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setState({ data: null, error: "", loading: true });
        return loader(controller.signal);
      })
      .then((data) => {
        if (active) setState({ data, error: "", loading: false });
      })
      .catch((error) => {
        if (active && error.name !== "AbortError")
          setState({ data: null, error: error.message, loading: false });
      });
    return () => {
      active = false;
      controller.abort();
    };
    // The caller supplies the resource identity explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, retry]);
  return { ...state, retry: () => setRetry((n) => n + 1) };
}
