import React, { useState, useEffect, useCallback } from 'react';
import SettingsDrawer from '../components/SettingsDrawer';
import { loadAllTabs, saveTab, loadSettings, saveSettings, loadUserId, saveUserId, generateUserId, collapseData, loadLastModified, saveLastModified } from '../storage';
import s from './HomePage.module.css';

const TABS = [
  { id: 'todo',     label: 'Todo' },
  { id: 'shared',   label: 'Shared' },
  { id: 'template', label: 'Template' },
];

export default function HomePage({ onOpenDetail }) {
  const [activeTab, setActiveTab]     = useState(TABS[0]);
  const [globalData, setGlobalData]   = useState({ todo: [], shared: [], template: [] });
  const [mainInput, setMainInput]     = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [focusStack, setFocusStack]   = useState([]);
  const [clipboard, setClipboard]     = useState(null);
  const [settings, setSettings]       = useState({ showCompleted: true });
  const [userId, setUserId]           = useState('');

  // ----------------------------------------------------------------
  // PERSISTENCE
  // ----------------------------------------------------------------
  const fetchRemote = useCallback((id) => {
    fetch(`/todo/load.php?id=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(remote => {
        if (remote?.lastModified > loadLastModified()) {
          const processed = collapseData(remote);
          setGlobalData(processed);
          saveTab('todo', processed.todo);
          saveTab('shared', processed.shared);
          saveTab('template', processed.template);
          saveLastModified(remote.lastModified);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setGlobalData(loadAllTabs());
    setSettings(loadSettings());
    const id = loadUserId();
    setUserId(id);
    fetchRemote(id);
  }, []);

  const updateGlobalData = useCallback((tabId, newList) => {
    setGlobalData(prev => ({ ...prev, [tabId]: newList }));
    saveTab(tabId, newList);
  }, []);

  const handleSettingChange = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const handleUserIdChange = (id) => {
    setUserId(id);
    saveUserId(id);
    saveLastModified(0);
    fetchRemote(id);
  };

  // ----------------------------------------------------------------
  // REMOTE SYNC ON EXIT
  // ----------------------------------------------------------------
  useEffect(() => {
    const stripUiState = (list) => list.map(({ isExpanded, showInput, ...task }) => ({
      ...task,
      subTasks: stripUiState(task.subTasks || []),
    }));

    const syncToServer = (data) => {
      const id = loadUserId();
      if (!id) return;
      const ts = Date.now();
      const clean = {
        lastModified: ts,
        todo: stripUiState(data.todo),
        shared: stripUiState(data.shared),
        template: stripUiState(data.template),
      };
      saveLastModified(ts);
      fetch(`/todo/save.php?id=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(clean),
        keepalive: true,
      }).catch(() => {});
    };

    const handleUnload = () => syncToServer(globalData);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') syncToServer(globalData);
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [globalData]);

  // ----------------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------------
  const taskList = globalData[activeTab.id];

  const findInList = (list, id) => {
    for (const node of list) {
      if (node.id === id) return node;
      const found = findInList(node.subTasks || [], id);
      if (found) return found;
    }
    return null;
  };

  const findTaskGlobally = (id) =>
    findInList(globalData.todo, id) ||
    findInList(globalData.shared, id) ||
    findInList(globalData.template, id);

  // ----------------------------------------------------------------
  // FOCUS
  // ----------------------------------------------------------------
  const currentFocusId  = focusStack[focusStack.length - 1];
  const focusedTask     = currentFocusId ? findInList(taskList, currentFocusId) : null;

  const filterBySettings = (list) => {
    if (settings.showCompleted) return list;
    return list
      .filter(item => !item.completed)
      .map(item => ({ ...item, subTasks: filterBySettings(item.subTasks || []) }));
  };

  const displayData = filterBySettings(focusedTask ? [focusedTask] : taskList);

  // ----------------------------------------------------------------
  // TASK ACTIONS
  // ----------------------------------------------------------------
  const handleAddTask = (text, parentTask) => {
    if (!text.trim()) return;
    const newTask = {
      id: generateUserId(),
      text: text.trim(),
      isExpanded: false,
      subTasks: [],
      showInput: false,
      note: '',
    };
    const newList = [...taskList];
    if (parentTask) {
      const target = findInList(newList, parentTask.id);
      if (target) { target.subTasks.push(newTask); target.isExpanded = true; }
    } else {
      newList.push(newTask);
    }
    updateGlobalData(activeTab.id, newList);
    setMainInput('');
  };

  const handleDeleteTask = () => {
    if (!selectedItem) return;
    if (!window.confirm(`Delete "${selectedItem.item.text}"?`)) return;

    const idToDelete = selectedItem.item.id;
    const removeById = (list) =>
      list
        .filter(item => item.id !== idToDelete)
        .map(item => ({ ...item, subTasks: removeById(item.subTasks || []) }));

    const next = {
      todo:     removeById(globalData.todo),
      shared:   removeById(globalData.shared),
      template: removeById(globalData.template),
    };
    setGlobalData(next);
    saveTab('todo',     next.todo);
    saveTab('shared',   next.shared);
    saveTab('template', next.template);
    setSelectedItem(null);
  };

  const handleCopyTask = () => {
    if (selectedItem) {
      setClipboard({ data: JSON.parse(JSON.stringify(selectedItem.item)), fromTabId: activeTab.id });
      setSelectedItem(null);
    }
  };

  const incrementRefCounter = (list, targetId) =>
    list.map(item => {
      if (item.id === targetId) return { ...item, refCount: (item.refCount || 0) + 1 };
      if (item.subTasks?.length) return { ...item, subTasks: incrementRefCounter(item.subTasks, targetId) };
      return item;
    });

  const handlePasteTask = () => {
    if (!clipboard) return;

    let newTask;
    const isFromShared    = clipboard.fromTabId === 'shared';
    const isPastingShared = activeTab.id === 'shared';

    if (isFromShared && !isPastingShared) {
      newTask = {
        id: generateUserId(),
        text: `🔗 ${clipboard.data.text}`,
        isLink: true,
        originalId: clipboard.data.id,
        subTasks: [],
        note: 'Reference to Shared Task.',
      };
      updateGlobalData('shared', incrementRefCounter(globalData.shared, clipboard.data.id));
    } else {
      newTask = { ...JSON.parse(JSON.stringify(clipboard.data)), id: generateUserId(), refCount: 0 };
    }

    const newGlobalData = JSON.parse(JSON.stringify(globalData));
    const currentTabList = newGlobalData[activeTab.id];

    if (selectedItem) {
      const parent = findInList(currentTabList, selectedItem.item.id);
      if (parent) { parent.subTasks.push(newTask); parent.isExpanded = true; }
    } else if (focusedTask) {
      const parent = findInList(currentTabList, focusedTask.id);
      if (parent) { parent.subTasks.push(newTask); parent.isExpanded = true; }
    } else {
      currentTabList.push(newTask);
    }

    setGlobalData(newGlobalData);
    saveTab(activeTab.id, currentTabList);
    setSelectedItem(null);
  };

  const handleOpenDetail = () => {
    if (!selectedItem) return;
    onOpenDetail(selectedItem.item, (id, { note, completed, reappearAfter, completedAt }) => {
      const newList = [...taskList];
      const target = findInList(newList, id);
      if (target) {
        target.note = note;
        target.completed = completed;
        target.reappearAfter = reappearAfter;
        target.completedAt = completedAt;
        updateGlobalData(activeTab.id, newList);
      }
    });
    setSelectedItem(null);
  };

  // ----------------------------------------------------------------
  // RENDER TREE (recursive, same logic as mobile)
  // ----------------------------------------------------------------
  const renderTask = (item, depth = 0) => {
    const isSelected    = selectedItem?.item.id === item.id;
    const isRootOfFocus = item.id === currentFocusId;

    const sourceTask      = item.isLink ? findTaskGlobally(item.originalId) : null;
    const isBrokenLink    = item.isLink && !sourceTask;
    const effectiveSubs   = item.isLink ? (sourceTask?.subTasks || []) : (item.subTasks || []);
    const hasChildren     = effectiveSubs.length > 0;

    const toggleExpand = () => {
      if (!hasChildren || isBrokenLink) return;
      item.isExpanded = !item.isExpanded;
      updateGlobalData(activeTab.id, [...taskList]);
    };

    const handleSelect = () => {
      setSelectedItem(isSelected ? null : { item });
    };

    const handleInlineAdd = (e) => {
      e.stopPropagation();
      item.isExpanded = true;
      item.showInput  = true;
      updateGlobalData(activeTab.id, [...taskList]);
    };

    const handleSubInputKey = (e) => {
      if (e.key === 'Enter') {
        const txt = e.target.value.trim();
        if (txt) {
          item.subTasks.push({
            id: generateUserId(),
            text: txt,
            isExpanded: false,
            subTasks: [],
            showInput: false,
            note: '',
          });
          item.isExpanded = true;
        }
        item.showInput = false;
        updateGlobalData(activeTab.id, [...taskList]);
      } else if (e.key === 'Escape') {
        item.showInput = false;
        updateGlobalData(activeTab.id, [...taskList]);
      }
    };

    return (
      <div key={item.id} className={s.itemWrap} style={{ marginLeft: depth > 0 ? 24 : 0 }}>
        <div
          className={[
            s.itemRow,
            isSelected  ? s.selected  : '',
            isRootOfFocus ? s.focusRoot : '',
            item.completed ? s.completed : '',
          ].join(' ')}
          onClick={handleSelect}
        >
          {/* expand / collapse icon */}
          <button
            className={s.expandBtn}
            onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
            tabIndex={-1}
          >
            {isBrokenLink ? '⚠️' : hasChildren ? (item.isExpanded ? '▼' : '▶') : null}
          </button>

          <span className={[s.itemText, isBrokenLink ? s.broken : ''].join(' ')}>
            {item.text}
            {isBrokenLink && <em> (Broken Source)</em>}
            {item.refCount > 0 && <span className={s.refCount}> (Ref: {item.refCount})</span>}
          </span>

          {item.note?.trim() && <span className={s.noteIcon} title="Has notes">📝</span>}

          {!isRootOfFocus && !item.isLink && (
            <button className={s.inlinePlus} onClick={handleInlineAdd} title="Add subtask">+</button>
          )}
        </div>

        {item.isExpanded && !isBrokenLink && (
          <div className={s.subList}>
            {effectiveSubs.map(sub => renderTask(sub, depth + 1))}
            {item.showInput && !item.isLink && (
              <input
                className={s.subInput}
                placeholder="Enter sub-task..."
                autoFocus
                onKeyDown={handleSubInputKey}
                onBlur={() => { item.showInput = false; updateGlobalData(activeTab.id, [...taskList]); }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSelectedItem(null);
    setFocusStack([]);
  };

  const breadcrumbs = focusStack.map(id => findInList(taskList, id)?.text).filter(Boolean).join(' › ');

  return (
    <div className={s.layout}>
      {/* TOP BAR */}
      <div className={s.topBar}>
        <div className={s.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={[s.tab, activeTab.id === tab.id ? s.activeTab : ''].join(' ')}
              onClick={() => switchTab(tab)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <SettingsDrawer settings={settings} onSettingChange={handleSettingChange} userId={userId} onUserIdChange={handleUserIdChange} />
      </div>

      {/* BREADCRUMB + TITLE */}
      <div className={s.navHeader}>
        <div className={s.navRow}>
          {focusStack.length > 0 && (
            <button className={s.backBtn} onClick={() => { setFocusStack(focusStack.slice(0, -1)); setSelectedItem(null); }}>
              ← Back
            </button>
          )}
          {breadcrumbs && <span className={s.breadcrumb}>{breadcrumbs}</span>}
        </div>
        <h1 className={s.title}>{focusedTask ? focusedTask.text : 'Nested Focus'}</h1>
      </div>

      {/* TASK LIST */}
      <div className={s.listArea}>
        {displayData.map(item => renderTask(item))}

        {/* MAIN ADD INPUT */}
        <div className={s.mainInputWrap}>
          <input
            className={s.mainInput}
            placeholder={`Add to ${focusedTask ? focusedTask.text : activeTab.label}...`}
            value={mainInput}
            onChange={(e) => setMainInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(mainInput, focusedTask); }}
          />
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className={s.bottomBar}>
        <span className={s.statusLabel}>
          {selectedItem
            ? `Selected: "${selectedItem.item.text}"`
            : clipboard
            ? 'Clipboard: Item ready'
            : 'Select a task to edit'}
        </span>
        <div className={s.actionRow}>
          <button
            className={s.actionBtn}
            style={{ background: selectedItem ? 'var(--primary)' : 'var(--disabled)' }}
            disabled={!selectedItem}
            onClick={() => { setFocusStack([...focusStack, selectedItem.item.id]); setSelectedItem(null); }}
          >
            Focus
          </button>
          <button
            className={s.actionBtn}
            style={{ background: selectedItem ? 'var(--primary)' : 'var(--disabled)' }}
            disabled={!selectedItem}
            onClick={handleCopyTask}
          >
            Copy
          </button>
          <button
            className={s.actionBtn}
            style={{ background: clipboard ? 'var(--success)' : 'var(--disabled)' }}
            disabled={!clipboard}
            onClick={handlePasteTask}
          >
            Paste
          </button>
          <button
            className={s.actionBtn}
            style={{ background: selectedItem ? 'var(--primary)' : 'var(--disabled)' }}
            disabled={!selectedItem}
            onClick={handleOpenDetail}
          >
            Open
          </button>
          <button
            className={s.actionBtn}
            style={{ background: selectedItem ? 'var(--danger)' : 'var(--disabled)' }}
            disabled={!selectedItem}
            onClick={handleDeleteTask}
          >
            Del
          </button>
        </div>
      </div>
    </div>
  );
}
