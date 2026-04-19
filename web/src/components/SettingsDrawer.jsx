import React, { useState } from 'react';
import { generateUserId } from '../storage';
import s from './SettingsDrawer.module.css';

export default function SettingsDrawer({ settings, onSettingChange, userId, onUserIdChange }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const startEdit = () => {
    setDraft(userId);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed) onUserIdChange(trimmed);
    setEditing(false);
  };

  const handleRandomize = () => {
    const id = generateUserId();
    onUserIdChange(id);
    setEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <>
      <button className={s.hamburger} onClick={() => setOpen(true)} title="Settings">
        ☰
      </button>

      {open && (
        <div className={s.overlay} onClick={() => setOpen(false)}>
          <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
            <h2 className={s.title}>Settings</h2>

            <div className={s.row}>
              <div className={s.rowText}>
                <span className={s.label}>Show Completed</span>
                <span className={s.sub}>Display tasks marked as done</span>
              </div>
              <label className={s.toggle}>
                <input
                  type="checkbox"
                  checked={settings.showCompleted}
                  onChange={(e) => onSettingChange('showCompleted', e.target.checked)}
                />
                <span className={s.slider} />
              </label>
            </div>

            <div className={s.idSection}>
              <span className={s.label}>User ID</span>
              <span className={s.sub}>Unique identifier for this client</span>
              <div className={s.idRow}>
                {editing ? (
                  <input
                    className={s.idInput}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
                    autoFocus
                    spellCheck={false}
                  />
                ) : (
                  <span className={s.idDisplay} onClick={handleCopy} title="Click to copy">
                    {userId}{copied && <span className={s.copiedBadge}>copied</span>}
                  </span>
                )}
                <div className={s.idButtons}>
                  {editing ? (
                    <button className={s.idBtn} onClick={commitEdit} title="Save">✓</button>
                  ) : (
                    <button className={s.idBtn} onClick={startEdit} title="Edit">✎</button>
                  )}
                  <button className={s.idBtn} onClick={handleRandomize} title="Randomize">⟳</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
