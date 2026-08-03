export const STORAGE_KEY = "lr1_items" as const;

// Save only events slice as in original implementation
export function saveToLocalStorage(state: { events: unknown }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
  } catch {
    // ignore quota/security errors to preserve behavior
  }
}

export function loadFromLocalStorage(key: string) {
  const json = localStorage.getItem(key);
  if (json === null) {
    return [];
  }
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
