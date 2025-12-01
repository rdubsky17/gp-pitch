'use client';
import { useEffect, useRef, useState } from 'react';
import usePitchScorer from '@/components/usePitchScorer';

// Loaded via <script src="/vendor/alphaTab.min.js" defer> in app/layout.tsx
declare const alphaTab: any;

type Props = { fileUrl: string };
type TrackItem = { idx: number; name: string };

export default function TabViewer({ fileUrl }: Props) {
  const [currentFile, setCurrentFile] = useState<string>(fileUrl);
  // allow external load requests
  useEffect(() => {
    const onLoad = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const url = typeof d.url === 'string' ? d.url : d.file;
      if (typeof url === 'string' && url) setCurrentFile(url);
    };
    window.addEventListener('load-song', onLoad as EventListener);
    return () => window.removeEventListener('load-song', onLoad as EventListener);
  }, []);
  const hostRef     = useRef<HTMLDivElement | null>(null);   // alphaTab host
  const viewportRef = useRef<HTMLDivElement | null>(null);   // scroll container
  const apiRef      = useRef<any>(null);
  const trackIdxRef = useRef<number | null>(null);

  const { live, score, validity, validityRef, scoreRef } = usePitchScorer();

  const [ready, setReady]         = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks]       = useState<TrackItem[]>([]);
  const [trackIdx, setTrackIdx]   = useState<number | null>(null);
  const [audioOn, setAudioOn]     = useState(false);
  // Listen for global transport / track / audio events from TopRibbon
  useEffect(() => {
    const onPlay = () => handlePlay();
    const onPause = () => handlePause();
    const onStop = () => handleStop();
    const onSelect = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const idx = typeof d.idx === 'number' ? d.idx : parseInt(String(d.idx || ''), 10);
      if (!Number.isNaN(idx)) onSelectTrack(String(idx));
    };
    const onAudioToggle = (e: Event) => {
      const on = !!(e as CustomEvent).detail?.on;
      setAudioOn(on);
      applyVolume(on);
    };

    window.addEventListener('play-alpha', onPlay as EventListener);
    window.addEventListener('pause-alpha', onPause as EventListener);
    window.addEventListener('stop-alpha', onStop as EventListener);
    window.addEventListener('select-track', onSelect as EventListener);
    window.addEventListener('audio-toggle', onAudioToggle as EventListener);
    return () => {
      window.removeEventListener('play-alpha', onPlay as EventListener);
      window.removeEventListener('pause-alpha', onPause as EventListener);
      window.removeEventListener('stop-alpha', onStop as EventListener);
      window.removeEventListener('select-track', onSelect as EventListener);
      window.removeEventListener('audio-toggle', onAudioToggle as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRef.current, tracks]);

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
    const fileToLoad = currentFile;

    const api = new alphaTab.AlphaTabApi(hostRef.current, {
      file: fileToLoad,
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

    // Detect when song finishes naturally (not stopped manually)
    api.playerFinished?.on?.(() => {
      // Get the actual rendered track from the API
      let instrumentName = 'Unknown Instrument';
      
      try {
        // Method 1: Check api.settings.display.tracks (what we told it to render)
        if (api.settings?.display?.tracks && api.settings.display.tracks.length > 0) {
          const renderedTrack = api.settings.display.tracks[0];
          instrumentName = renderedTrack?.name || 'Unknown Instrument';
        }
        // Method 2: Use the trackIdx state variable
        else if (trackIdx !== null && api.score?.tracks) {
          const track = api.score.tracks[trackIdx];
          instrumentName = track?.name || 'Unknown Instrument';
        }
        // Method 3: Use trackIdxRef (fallback)
        else if (trackIdxRef.current !== null && api.score?.tracks) {
          const track = api.score.tracks[trackIdxRef.current];
          instrumentName = track?.name || 'Unknown Instrument';
        }
        // Method 4: Last resort - just get first track
        else if (api.score?.tracks && api.score.tracks.length > 0) {
          instrumentName = api.score.tracks[0]?.name || 'Unknown Instrument';
        }
      } catch (e) {
        console.error('[TabViewer] Error getting track:', e);
      }

      // Get song name from filename
      const songNameMap: Record<string, string> = {
        '/songs/Gorillaz-Feel Good Inc.-09-23-2025.gp': 'Feel Good Inc.',
        '/songs/Muse-Hysteria-09-20-2025.gp': 'Hysteria',
        '/songs/Red Hot Chili Peppers-Aeroplane-09-11-2025.gp': 'Aeroplane',
        '/songs/Travis Scott-Sicko Mode-12-11-2024.gp': 'SICKO MODE',
        '/songs/Fortnite-OG Lobby Theme-12-07-2024.gp': 'OG Lobby Theme',
        '/songs/DaBaby feat. Roddy Ricch-Rockstar-08-01-2025.gp': 'Rockstar',
      };
      const songName = songNameMap[currentFile] || 'Unknown Song';

      // Emit basic event for backward compatibility
      window.dispatchEvent(new CustomEvent('song-finished'));

      // Use refs to get latest values (avoid closure staleness)
      const latestScore = scoreRef?.current || score;
      const latestValidity = validityRef?.current || validity;

      // Emit enriched event with all data needed for saving
      window.dispatchEvent(new CustomEvent('song-finished-with-data', {
        detail: {
          score: latestScore,
          validity: latestValidity,
          currentFile,
          trackName: instrumentName,
          songName,
        }
      }));
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

      // Check if this is the first beat of the song (beat 1, bar 1)
      // Beat objects have index property (0-based) and voice.bar.index
      const beatIndex = beat?.index ?? beat?.beat?.index ?? -1;
      const barIndex = beat?.voice?.bar?.index ?? beat?.beat?.voice?.bar?.index ?? -1;
      const isFirstBeat = beatIndex === 0 && barIndex === 0;

      window.dispatchEvent(new CustomEvent('tab-expected', {
        detail: { tSec, pitches, xPx: beat?.x ?? 0, isFirstBeat }
      }));

      // allow DOM to place the cursor first, then scroll
      requestAnimationFrame(ensureCursorVisible);
    });

    // Fallback based on ticks
    api.playerPositionChanged?.on?.(() => {
      requestAnimationFrame(ensureCursorVisible);
    });

    // Detect when user clicks on beats/measures during playback (seeking)
    api.beatMouseDown?.on?.(() => {
      // Check if currently playing
      const state = api.playerState ?? api.player?.state;
      const code = typeof state === 'number' ? state : (state?.state ?? state?.playerState ?? state);
      const playing = code === 1 || code === 'Playing' || code === 'playing';
      
      if (playing) {
        // User clicked a measure while playing - this is seeking
        window.dispatchEvent(new CustomEvent('seek-alpha'));
      }
    });

    return () => {
      try { api?.destroy?.(); } catch {}
      setTracks([]); setTrackIdx(null); setIsPlaying(false); setReady(false);
    };
  }, [currentFile]);

  // keep internal currentFile in sync if parent prop changes
  useEffect(() => { setCurrentFile(fileUrl); }, [fileUrl]);

  // Keep trackIdxRef in sync with trackIdx state
  useEffect(() => {
    if (trackIdx !== null) {
      trackIdxRef.current = trackIdx;
    }
  }, [trackIdx]);

  const onSelectTrack = (idxStr: string) => {
    const idx = parseInt(idxStr, 10);
    setTrackIdx(idx);
    trackIdxRef.current = idx;
    renderSelectedTrack(idx);
    // after re-render, make sure the first cursor in this track is visible when playback runs
    setTimeout(() => requestAnimationFrame(ensureCursorVisible), 0);
  };

  const handlePlay  = () => { 
    const a = apiRef.current; 
    try { 
      // Reset score state before starting playback
      window.dispatchEvent(new CustomEvent('reset-scorer'));
      a?.play?.();  
      setIsPlaying(true);  
      requestAnimationFrame(ensureCursorVisible); 
    } catch {} 
  };
  const handlePause = () => { const a = apiRef.current; try { a?.pause?.(); setIsPlaying(false); } catch {} };
  const handleStop  = () => { const a = apiRef.current; try { a?.stop?.();  setIsPlaying(false); } catch {} };

  const controlsDisabled = !ready || tracks.length === 0;
  // Broadcast tab status for TopRibbon to consume
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-status', { detail: { score, live, isPlaying, tracks, trackIdx } }));
  }, [score, live, isPlaying, tracks, trackIdx]);

  return (
    <div className="alphaTabCard" style={{ display:'grid', gap:12, position:'relative' }}>
      {/* Viewport only — header moved to TopRibbon (merged UI) */}
      <div
        ref={viewportRef}
        className="at-viewport"
        style={{ position:'relative', overflow:'auto', borderRadius:4, maxHeight:'91vh' }}
      >
        <div ref={hostRef} />
      </div>
    </div>
  );
}
