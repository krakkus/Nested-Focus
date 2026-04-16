import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import DetailPanel from './pages/DetailPanel';

export default function App() {
  // Instead of a navigation stack, the detail view slides in as a panel.
  // openDetail = { task, onSave } | null
  const [openDetail, setOpenDetail] = useState(null);

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <HomePage
        onOpenDetail={(task, onSave) => setOpenDetail({ task, onSave })}
      />
      {openDetail && (
        <DetailPanel
          task={openDetail.task}
          onSave={openDetail.onSave}
          onClose={() => setOpenDetail(null)}
        />
      )}
    </div>
  );
}
