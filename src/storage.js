const STORAGE_KEY = "coffee-lab-data-v1";

export function loadData(defaultData) {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultData;
    const parsed = JSON.parse(saved);
    return {
      ...defaultData,
      ...parsed,
      setup: { ...defaultData.setup, ...parsed.setup },
    };
  } catch {
    return defaultData;
  }
}

export function saveData(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // The app remains usable if storage is unavailable.
  }
}
