import React, { useState, useEffect, useRef } from 'react';
import s from './DetailPanel.module.css';

const REAPPEAR_OPTIONS = [
  { label: 'Never',   value: 0 },
  { label: '1 day',   value: 86400000 },
  { label: '3 days',  value: 259200000 },
  { label: '1 week',  value: 604800000 },
  { label: '2 weeks', value: 1209600000 },
  { label: '1 month', value: 2592000000 },
];

export default function DetailPanel({ task, onSave, onClose }) {
  const [note, setNote]               = useState(task.note || '');
  const [completed, setCompleted]     = useState(task.completed || false);
  const [reappearAfter, setReappear]  = useState(task.reappearAfter || 0);

  // Keep refs so the close handler always reads latest state
  const noteRef        = useRef(note);
  const completedRef   = useRef(completed);
  const reappearRef    = useRef(reappearAfter);
  useEffect(() => { noteRef.current = note; }, [note]);
  useEffect(() => { completedRef.current = completed; }, [completed]);
  useEffect(() => { reappearRef.current = reappearAfter; }, [reappearAfter]);

  const handleClose = () => {
    onSave(task.id, {
      note: noteRef.current,
      completed: completedRef.current,
      reappearAfter: reappearRef.current,
      completedAt: completedRef.current ? (task.completedAt || Date.now()) : null,
    });
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={s.overlay} onClick={handleClose}>
      <div className={s.panel} onClick={(e) => e.stopPropagation()}>
        <div className={s.topBar}>
          <button className={s.doneBtn} onClick={handleClose}>← Done</button>
        </div>

        <h1 className={[s.title, completed ? s.completedTitle : ''].join(' ')}>{task.text}</h1>

        <button
          className={[s.completeBtn, completed ? s.completedBtn : ''].join(' ')}
          onClick={() => setCompleted(prev => !prev)}
        >
          {completed ? '✓  Completed' : 'Mark as Complete'}
        </button>

        <label className={s.sectionLabel}>NOTES</label>
        <textarea
          className={s.noteInput}
          placeholder="Add details, links, or sub-notes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <label className={s.sectionLabel} style={{ marginTop: 24 }}>REAPPEAR AFTER COMPLETION</label>
        <div className={s.chipRow}>
          {REAPPEAR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={[s.chip, reappearAfter === opt.value ? s.activeChip : ''].join(' ')}
              onClick={() => setReappear(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {reappearAfter > 0 && (
          <p className={s.reappearHint}>
            Task will reappear {REAPPEAR_OPTIONS.find(o => o.value === reappearAfter)?.label} after being marked complete.
          </p>
        )}
      </div>
    </div>
  );
}
