const SAVE_KEY = 'deeploop_save';
const SAVE_VERSION = 1;
const AUTO_SAVE_INTERVAL = 10000;

let autoSaveTimer = null;

export function save(gameState) {
  try {
    const data = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: gameState,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== SAVE_VERSION) return null;
    return data.state;
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function startAutoSave(getState) {
  stopAutoSave();
  autoSaveTimer = setInterval(() => {
    save(getState());
  }, AUTO_SAVE_INTERVAL);
}

export function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

export function getAutoSaveTimer() {
  return autoSaveTimer;
}

export { SAVE_KEY, SAVE_VERSION, AUTO_SAVE_INTERVAL };
