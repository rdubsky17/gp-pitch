'use client';

import { useEffect, useState } from 'react';

export default function ScoreSavedToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleScoreSaved = (e: Event) => {
      const { percentage } = (e as CustomEvent).detail;
      setMessage(`Score saved: ${percentage}%`);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 4000);
    };

    window.addEventListener('score-saved', handleScoreSaved as EventListener);
    return () => {
      window.removeEventListener('score-saved', handleScoreSaved as EventListener);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: '#10b981',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        fontWeight: 600,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      ✓ {message}
    </div>
  );
}
