// localStorage-backed persistence — mirrors the AsyncStorage API used in mobile.

const KEYS = {
  todo: '@todo_v1',
  shared: '@shared_v1',
  template: '@template_v1',
  settings: '@settings_v1',
};

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

export function loadAllTabs() {
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
    todo: collapseRecursive(loadItem(KEYS.todo) || []),
    shared: collapseRecursive(loadItem(KEYS.shared) || []),
    template: collapseRecursive(loadItem(KEYS.template) || []),
  };
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
