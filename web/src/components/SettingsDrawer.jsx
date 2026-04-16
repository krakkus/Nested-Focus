import React, { useState } from 'react';
import s from './SettingsDrawer.module.css';

export default function SettingsDrawer({ settings, onSettingChange }) {
  const [open, setOpen] = useState(false);

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
          </div>
        </div>
      )}
    </>
  );
}
