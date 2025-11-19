"use client";
import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SettingsPanel from './SettingsPanel';

export default function TopRibbon() {
  const pathname = usePathname();
  // hide the global ribbon on the login page
  if (pathname === '/login') return null;

  const [showSettings, setShowSettings] = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [freq, setFreq] = useState(0);
  const [scoreState, setScoreState] = useState<{ hits: number; total: number }>({ hits: 0, total: 0 });
  const [liveState, setLiveState] = useState<{ err: number; ok: boolean; target: number | null }>({ err: 0, ok: false, target: null });
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState<Array<{ idx: number; name: string }>>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [songs, setSongs] = useState<Array<{ name: string; file: string }>>([]);

  // Listen for pitch status events from PitchMeter
  useEffect(() => {
    const onStatus = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      setRunning(Boolean(d.running));
      setStatus(typeof d.status === 'string' ? d.status : '');
      setFreq(typeof d.freq === 'number' ? d.freq : 0);
    };
    window.addEventListener('pitch-status', onStatus as EventListener);
    const onTab = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d.score) setScoreState(d.score);
      if (d.live) setLiveState(d.live);
      if (typeof d.isPlaying === 'boolean') setIsPlaying(d.isPlaying);
      if (Array.isArray(d.tracks)) setTracks(d.tracks);
      if (typeof d.trackIdx === 'number') setCurrentTrack(d.trackIdx);
    };
    window.addEventListener('tab-status', onTab as EventListener);
    // fetch songs manifest for Songs popout
    (async () => {
      try {
        const res = await fetch('/songs.json');
        if (res.ok) {
          const data = await res.json();
          setSongs(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.warn('Failed to load songs.json', e);
      }
    })();
    return () => {
      window.removeEventListener('pitch-status', onStatus as EventListener);
      window.removeEventListener('tab-status', onTab as EventListener);
    };
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setShowSettings(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <>
      <div style={{ height: 'var(--top-ribbon-h, 50px)' }} />
      <div style={{ position: 'fixed', left: 0, right: 0, top: 0, zIndex: 1100, background: 'black', color: '#fff', boxShadow: '0 8px 24px rgba(2,6,23,0.6)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 1200 }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.6, background: 'linear-gradient(135deg,#6ee7b7,#3b82f6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Guitar Tabs</div>

          {/* Song selection button */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowTracks(v => !v)} style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid rgba(197, 18, 18, 0.06)', fontSize: 13 }}>Song Selection</button>
            {showTracks && (
              <div style={{ position: 'absolute', left: 0, top: 'calc(100% + 8px)', background: '#fff', color: '#111', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', minWidth: 300 }}>
                <div style={{ padding: 10 }}>
                  <strong>Choose song</strong>
                </div>
                <div style={{ maxHeight: 320, overflow: 'auto' }}>
                  {songs.length === 0 && <div style={{ padding: 10, color: '#666' }}>No songs found</div>}
                  {songs.map((s, i) => (
                    <div key={i} style={{ padding: 10, borderTop: '1px solid #eee', cursor: 'pointer' }} onClick={() => { window.dispatchEvent(new CustomEvent('load-song', { detail: { url: s.file } })); setShowTracks(false); }}>{s.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instrument selection (smaller) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 13 }}>Instrument:</div>
            <select
              value={currentTrack ?? ''}
              onChange={e => {
                const idx = parseInt(e.target.value, 10);
                setCurrentTrack(Number.isNaN(idx) ? null : idx);
                window.dispatchEvent(new CustomEvent('select-track', { detail: { idx } }));
              }}
              style={{ padding: '6px 8px', borderRadius: 6, background: '#0b1220', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', fontSize: 13, minWidth: 120 }}
            >
              <option value="">Instrument</option>
              {tracks.map(t => <option key={t.idx} value={t.idx}>{t.name}</option>)}
            </select>
          </label>
        </div>

        {/* center overlay for Score + Intonation to ensure true visual centering */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 18, alignItems: 'center', color: '#fff', fontSize: 14, pointerEvents: 'none' }}>
          <div>
            <strong>Score:</strong>{' '}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{scoreState.hits}/{scoreState.total}</span>
          </div>
          <div>
            <strong>Intonation:</strong>{' '}
            {liveState.target !== null
              ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(liveState.err)} cents {liveState.ok ? '✅' : '❌'}</span>
              : '—'}
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', zIndex: 1200 }}>
          {/* Transport + audio toggle: Start/Stop -> Pause -> Audio */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginRight: 6 }}>
            <button
              onClick={() => {
                const shouldStop = Boolean(isPlaying);
                if (shouldStop) {
                  window.dispatchEvent(new CustomEvent('stop-alpha'));
                  window.dispatchEvent(new CustomEvent('stop-pitch-meter'));
                } else {
                  window.dispatchEvent(new CustomEvent('start-pitch-meter'));
                  window.dispatchEvent(new CustomEvent('play-alpha'));
                }
              }}
              aria-pressed={Boolean(isPlaying)}
              style={{ padding: '8px 14px', borderRadius: 10, background: isPlaying ? '#ef4444' : '#10b981', border: 'none', color: '#fff', fontWeight: 700 }}
            >{isPlaying ? 'Stop' : 'Start'}</button>

            <button onClick={() => window.dispatchEvent(new CustomEvent('pause-alpha'))} style={{ padding: '8px 10px', borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }}>Pause</button>
          </div>
          {/* keep settings/profile/leaderboard compact on the right side */}
          <div style={{ position: 'relative' }} ref={ref}>
            <button onClick={() => setShowSettings(v => !v)} aria-haspopup="true" style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }}>Input Settings</button>
            {showSettings && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)' }}>
                <SettingsPanel />
              </div>
            )}
          </div>

          <button onClick={() => setShowProfile(v => !v)} aria-haspopup="true" style={{ padding: '8px 10px', borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }}>Profile</button>
          <button style={{ padding: '8px 10px', borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }}>Leaderboard</button>
        </div>
      </div>
    </>
  );
}
