// localStorage-backed persistence — mirrors the AsyncStorage API used in mobile.

const KEYS = {
  todo: '@todo_v1',
  shared: '@shared_v1',
  template: '@template_v1',
  settings: '@settings_v1',
  userId: '@user_id_v1',
  lastModified: '@last_modified_v1',
};

const USER_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

export function generateUserId() {
  const buf = new Uint8Array(11);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => USER_ID_CHARS[b % 64]).join('');
}

export function loadUserId() {
  const stored = localStorage.getItem(KEYS.userId);
  if (stored) return stored;
  const id = generateUserId();
  localStorage.setItem(KEYS.userId, id);
  return id;
}

export function saveUserId(id) {
  localStorage.setItem(KEYS.userId, id);
}

export function loadItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage save error', e);
  }
}

export function collapseData(raw) {
  const now = Date.now();
  const collapseRecursive = (list) =>
    (list || []).map((item) => {
      const shouldReappear =
        item.completed &&
        item.reappearAfter > 0 &&
        item.completedAt &&
        item.completedAt + item.reappearAfter <= now;
      return {
        ...item,
        isExpanded: false,
        showInput: false,
        completed: shouldReappear ? false : item.completed,
        completedAt: shouldReappear ? null : item.completedAt,
        subTasks: collapseRecursive(item.subTasks || []),
      };
    });
  return {
    todo: collapseRecursive(raw.todo || []),
    shared: collapseRecursive(raw.shared || []),
    template: collapseRecursive(raw.template || []),
  };
}

export function loadAllTabs() {
  return collapseData({
    todo: loadItem(KEYS.todo),
    shared: loadItem(KEYS.shared),
    template: loadItem(KEYS.template),
  });
}

export function loadLastModified() {
  return loadItem(KEYS.lastModified) || 0;
}

export function saveLastModified(ts) {
  saveItem(KEYS.lastModified, ts);
}

export function saveTab(tabId, data) {
  saveItem(KEYS[tabId], data);
}

export function loadSettings() {
  return loadItem(KEYS.settings) || { showCompleted: true };
}

export function saveSettings(settings) {
  saveItem(KEYS.settings, settings);
}
