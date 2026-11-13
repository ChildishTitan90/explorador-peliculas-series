import { useSyncExternalStore } from "react";
import { initial } from "../social/socialDemoData";
let entries = initial;
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => entries;
function setEntries(update) {
  entries = typeof update === "function" ? update(entries) : update;
  listeners.forEach((listener) => listener());
}
export function useDemoEntries() {
  return [useSyncExternalStore(subscribe, snapshot, snapshot), setEntries];
}
