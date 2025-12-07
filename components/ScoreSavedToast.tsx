'use client';

import { useEffect, useState } from 'react';

interface ScoreData {
  percentage: number;
  hits: number;
  total: number;
  songName: string;
  instrument: string;
  trackId: number;
}

export default function ScoreConfirmModal() {
  const [visible, setVisible] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleScoreReady = (e: Event) => {
      const data = (e as CustomEvent).detail as ScoreData;
      setScoreData(data);
      setVisible(true);
      setSaved(false);
      setError(null);
    };

    const handleScoreError = (e: Event) => {
      const data = (e as CustomEvent).detail as { message: string };
      setError(data.message);
      setVisible(true);
      setSaved(false);
      setScoreData(null);
    };

    window.addEventListener('score-ready-to-save', handleScoreReady as EventListener);
    window.addEventListener('score-save-error', handleScoreError as EventListener);
    return () => {
      window.removeEventListener('score-ready-to-save', handleScoreReady as EventListener);
      window.removeEventListener('score-save-error', handleScoreError as EventListener);
    };
  }, []);

  const handleSave = async () => {
    if (!scoreData || saving) return;
    setSaving(true);
    
    // Dispatch event to trigger actual save logic
    window.dispatchEvent(new CustomEvent('confirm-save-score', {
      detail: scoreData
    }));
    
    // Wait for save to complete
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      
      // Auto-close after showing success
      setTimeout(() => {
        setVisible(false);
      }, 1500);
    }, 1000);
  };

  const handleDiscard = () => {
    setVisible(false);
    setScoreData(null);
    setError(null);
  };

  if (!visible) return null;

  // Show error message
  if (error) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9998,
            animation: 'fadeIn 0.3s ease-out',
          }}
          onClick={handleDiscard}
        />
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            zIndex: 9999,
            minWidth: 400,
            textAlign: 'center',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16, color: '#ef4444' }}>⚠️</div>
          <h2 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: 24 }}>Error</h2>
          <p style={{ color: '#666', marginBottom: 24, fontSize: 16 }}>{error}</p>
          <button
            onClick={handleDiscard}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, -40%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}</style>
      </>
    );
  }

  if (!scoreData) return null;

  // Calculate grade based on percentage
  const getGrade = (pct: number) => {
    if (pct >= 95) return { grade: 'S', color: '#fbbf24' };
    if (pct >= 90) return { grade: 'A+', color: '#10b981' };
    if (pct >= 85) return { grade: 'A', color: '#10b981' };
    if (pct >= 80) return { grade: 'B+', color: '#3b82f6' };
    if (pct >= 75) return { grade: 'B', color: '#3b82f6' };
    if (pct >= 70) return { grade: 'C+', color: '#8b5cf6' };
    if (pct >= 65) return { grade: 'C', color: '#8b5cf6' };
    if (pct >= 50) return { grade: 'D', color: '#6e43d4ff' };
    return { grade: 'F', color: '#ef4444' };
  };

  const { grade, color } = getGrade(scoreData.percentage);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998,
          animation: 'fadeIn 0.3s ease-out',
        }}
        onClick={handleDiscard}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 9999,
          minWidth: 400,
          maxWidth: 500,
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {saved ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h2 style={{ margin: 0, color: '#10b981', fontSize: 24 }}>Score Saved!</h2>
          </div>
        ) : (
          <>
            <h2 style={{ marginTop: 0, textAlign: 'center', fontSize: 28, color: '#111' }}>
              Song Complete!
            </h2>

            {/* Grade Badge */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  display: 'inline-flex',
                  background: color,
                  color: '#fff',
                  fontSize: 72,
                  fontWeight: 700,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}
              >
                {grade}
              </div>
            </div>

            {/* Score Details */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ textAlign: 'center', fontSize: 48, fontWeight: 700, color: '#111', marginBottom: 8 }}>
                {scoreData.percentage}%
              </div>
              <div style={{ textAlign: 'center', fontSize: 16, color: '#666', marginBottom: 16 }}>
                {scoreData.hits} / {scoreData.total} notes hit
              </div>
              <div style={{ textAlign: 'center', fontSize: 14, borderTop: '1px solid #e5e5e5', paddingTop: 16 }}>
                <div style={{ fontWeight: 600, color: '#111', fontSize: 16, marginBottom: 6 }}>{scoreData.songName}</div>
                <div style={{ color: '#666', fontSize: 14 }}>{scoreData.instrument}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleDiscard}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '2px solid #d1d5db',
                  color: '#6b7280',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: saving ? '#9ca3af' : '#10b981',
                  border: 'none',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Score'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
