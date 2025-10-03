'use client';
import { useEffect, useRef, useState } from 'react';
import usePitchScorer from '@/components/usePitchScorer';

// Loaded via <script src="/vendor/alphaTab.min.js" defer> in app/layout.tsx
declare const alphaTab: any;

type Props = { fileUrl: string };
type TrackItem = { idx: number; name: string };

export default function TabViewer({ fileUrl }: Props) {
  const hostRef     = useRef<HTMLDivElement | null>(null);   // alphaTab host
  const viewportRef = useRef<HTMLDivElement | null>(null);   // scroll container
  const apiRef      = useRef<any>(null);
  const trackIdxRef = useRef<number | null>(null);

  const { live, score } = usePitchScorer();

  const [ready, setReady]         = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks]       = useState<TrackItem[]>([]);
  const [trackIdx, setTrackIdx]   = useState<number | null>(null);
  const [audioOn, setAudioOn]     = useState(false);

  // --- NEW: keep the cursor visible in the viewport (Page layout) ---
  const ensureCursorVisible = () => {
    const vp = viewportRef.current;
    const host = hostRef.current;
    if (!vp || !host) return;

    const el =
      (host.querySelector('.at-cursor-beat') as HTMLElement) ||
      (host.querySelector('.at-cursor-bar')  as HTMLElement) ||
      (host.querySelector('.at-cursor')      as HTMLElement);

    if (!el) return;

    const vpRect  = vp.getBoundingClientRect();
    const elRect  = el.getBoundingClientRect();
    const topAbs  = elRect.top - vpRect.top + vp.scrollTop;
    const bottom  = topAbs + elRect.height;

    const pad = 80; // keep a little headroom above/below
    const viewTop = vp.scrollTop + pad;
    const viewBot = vp.scrollTop + vp.clientHeight - pad;

    if (topAbs < viewTop) {
      vp.scrollTo({ top: Math.max(topAbs - pad, 0), behavior: 'smooth' });
    } else if (bottom > viewBot) {
      vp.scrollTo({ top: bottom - vp.clientHeight + pad, behavior: 'smooth' });
    }
  };

  function renderSelectedTrack(idx: number) {
    const api = apiRef.current;
    const score = api?.score;
    if (!api || !score) return;
    const trackObj = score.tracks[idx];

    try {
      if (typeof api.renderTracks === 'function') {
        api.renderTracks([trackObj]);
      } else if (api.renderer && typeof api.renderer.renderTracks === 'function') {
        api.renderer.renderTracks([trackObj]);
      } else {
        const s = { ...(api.settings ?? {}), display: { ...(api.settings?.display ?? {}), tracks: [trackObj] } };
        api.updateSettings?.(s);
        api.requestRender?.();
      }
    } catch {
      api?.render?.();
    }
  }

  function applyVolume(on: boolean) {
    const api = apiRef.current;
    const v = on ? 1.0 : 0.0;
    try { api.player.volume = v; } catch {}
    try { api.settings.player.volume = v; api.updateSettings(api.settings); } catch {}
    try { if (api.synth?.masterGain) api.synth.masterGain.gain.value = v; } catch {}
  }

  useEffect(() => {
    if (!hostRef.current || !('alphaTab' in window)) return;

    const api = new alphaTab.AlphaTabApi(hostRef.current, {
      file: fileUrl,
      display: {
        layoutMode: (alphaTab?.LayoutMode?.Page ?? 0),
        resources: { playCursor: true },
      },
      player: {
        enablePlayer: true,
        enableCursor: true,
        soundFont: '/vendor/8MBGMSFX.SF2',
        volume: 0.0,
        speed: 1.0,
      },
      core: {
        includeNoteBounds: true,
      },
    });
    apiRef.current = api;

    // Try native autoscroll to a specific element (if supported by this build)
    try {
      const s = api.settings;
      if (s.player && 'scrollElement' in s.player) {
        (s.player as any).scrollElement = viewportRef.current || undefined;
      }
      if (s.player && 'enableAnimatedBeatCursor' in s.player) {
        s.player.enableAnimatedBeatCursor = true;
      }
      if (s.player && 'enableElementHighlighting' in s.player) {
        s.player.enableElementHighlighting = true;
      }
      api.updateSettings(s);
      api.requestRender();
    } catch {}

    applyVolume(false);

    api.renderFinished?.on?.(() => setReady(true));
    api.scoreLoaded.on((scoreObj: any) => {
      setReady(true);

      const list: TrackItem[] = scoreObj.tracks.map((t: any, i: number) => ({
        idx: i, name: t.name || `Track ${i + 1}`,
      }));
      setTracks(list);

      const bassGuess =
        list.find(t => /bass/i.test(t.name)) ??
        list.find((_, i) => (scoreObj.tracks[i]?.tuning?.length ?? 6) <= 5) ??
        list[0];

      if (bassGuess) {
        setTrackIdx(bassGuess.idx);
        trackIdxRef.current = bassGuess.idx;
        renderSelectedTrack(bassGuess.idx);
      }
    });

    api.playerStateChanged?.on?.((st: any) => {
      const code = typeof st === 'number' ? st : (st?.state ?? st?.playerState ?? st);
      const playing = code === 1 || code === 'Playing' || code === 'playing';
      setIsPlaying(!!playing);
    });

    // --- Emit expected notes AND keep cursor in view ---
    api.playedBeatChanged?.on?.((beatOrArgs: any) => {
      const beat = beatOrArgs?.beat ?? beatOrArgs;
      const notesArr = Array.isArray(beat?.notes) ? beat.notes
                    : Array.isArray(beat?.beat?.notes) ? beat.beat.notes
                    : [];
      const pitches: number[] = notesArr
        .map((n: any) => n?.realValue)
        .filter((x: any) => typeof x === 'number' && isFinite(x));

      const tSec =
        typeof api.timePosition === 'function' ? api.timePosition()
      : typeof api.timePosition === 'number'   ? api.timePosition
      : 0;

      window.dispatchEvent(new CustomEvent('tab-expected', {
        detail: { tSec, pitches, xPx: beat?.x ?? 0 }
      }));

      // allow DOM to place the cursor first, then scroll
      requestAnimationFrame(ensureCursorVisible);
    });

    // Fallback based on ticks
    api.playerPositionChanged?.on?.(() => {
      requestAnimationFrame(ensureCursorVisible);
    });

    return () => {
      try { api?.destroy?.(); } catch {}
      setTracks([]); setTrackIdx(null); setIsPlaying(false); setReady(false);
    };
  }, [fileUrl]);

  const onSelectTrack = (idxStr: string) => {
    const idx = parseInt(idxStr, 10);
    setTrackIdx(idx);
    trackIdxRef.current = idx;
    renderSelectedTrack(idx);
    // after re-render, make sure the first cursor in this track is visible when playback runs
    setTimeout(() => requestAnimationFrame(ensureCursorVisible), 0);
  };

  const handlePlay  = () => { const a = apiRef.current; try { a?.play?.();  setIsPlaying(true);  requestAnimationFrame(ensureCursorVisible); } catch {} };
  const handlePause = () => { const a = apiRef.current; try { a?.pause?.(); setIsPlaying(false); } catch {} };
  const handleStop  = () => { const a = apiRef.current; try { a?.stop?.();  setIsPlaying(false); } catch {} };

  const controlsDisabled = !ready || tracks.length === 0;

  return (
    <div className="alphaTabCard" style={{ display:'grid', gap:12, position:'relative' }}>
      {/* Header */}
      <div
        className="at-controls"
        style={{
          display:'grid',
          gridTemplateColumns:'auto 1fr auto auto',
          alignItems:'center',
          columnGap:12,
          position:'sticky', top:0, zIndex:10,
          padding:'8px 10px',
          background:'rgba(0,0,0,0.85)', color:'#fff', borderRadius:8
        }}
      >
        {/* Track select */}
        <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <span style={{ fontSize:12, opacity:0.9 }}>Track</span>
          <select
            value={trackIdx ?? ''}
            onChange={e => onSelectTrack(e.target.value)}
            disabled={controlsDisabled}
            style={{
              padding:'6px 8px',
              color:'#fff', background:'#111', border:'1px solid #555', borderRadius:6,
              cursor: controlsDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            {tracks.length === 0 && <option value="">Loading…</option>}
            {tracks.map(t => (
              <option key={t.idx} value={t.idx} style={{ color:'#111' }}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        {/* Score HUD */}
        <div style={{ display:'flex', gap:16, justifyContent:'center', fontSize:14 }}>
          <div>
            <strong>Score:</strong>{' '}
            <span style={{ fontVariantNumeric:'tabular-nums' }}>
              {score.hits}/{score.total}
            </span>
          </div>
          <div>
            <strong>Intonation:</strong>{' '}
            {live.target !== null
              ? <span style={{ fontVariantNumeric:'tabular-nums' }}>
                  {Math.round(live.err)} cents {live.ok ? '✅' : '❌'}
                </span>
              : '—'}
          </div>
        </div>

        {/* Transport */}
        <div style={{ display:'flex', gap:8, justifySelf:'end' }}>
          <button type="button" onClick={handlePlay}
            disabled={controlsDisabled || isPlaying}
            style={{
              padding:'6px 10px', border:'1px solid #666', borderRadius:6,
              background:'transparent', color:'#fff',
              cursor: (controlsDisabled || isPlaying) ? 'not-allowed' : 'pointer',
              opacity: (controlsDisabled || isPlaying) ? 0.5 : 1
            }}>
            Play
          </button>
          <button type="button" onClick={handlePause}
            disabled={controlsDisabled || !isPlaying}
            style={{
              padding:'6px 10px', border:'1px solid #666', borderRadius:6,
              background:'transparent', color:'#fff',
              cursor: (controlsDisabled || !isPlaying) ? 'not-allowed' : 'pointer',
              opacity: (controlsDisabled || !isPlaying) ? 0.5 : 1
            }}>
            Pause
          </button>
          <button type="button" onClick={handleStop}
            disabled={controlsDisabled}
            style={{
              padding:'6px 10px', border:'1px solid #666', borderRadius:6,
              background:'transparent', color:'#fff',
              cursor: controlsDisabled ? 'not-allowed' : 'pointer',
              opacity: controlsDisabled ? 0.5 : 1
            }}>
            Stop
          </button>
        </div>

        {/* Audio toggle */}
        <label style={{ display:'flex', alignItems:'center', gap:6, justifySelf:'end' }}>
          <input
            type="checkbox"
            checked={audioOn}
            onChange={e => { setAudioOn(e.target.checked); applyVolume(e.target.checked); }}
          />
          <span>Audio</span>
        </label>
      </div>

      {/* Viewport (multi-row Page layout) */}
      <div
        ref={viewportRef}
        className="at-viewport"
        style={{ position:'relative', overflow:'auto', borderRadius:8, maxHeight:'70vh' }}
      >
        <div ref={hostRef} />
      </div>
    </div>
  );
}
