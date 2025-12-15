'use client';
import { useEffect, useRef, useState } from 'react';
import usePitchScorer from '@/components/usePitchScorer';

// Loaded via <script src="/vendor/alphaTab.min.js" defer> in app/layout.tsx
declare const alphaTab: any;

type Props = { fileUrl: string };
type TrackItem = { idx: number; name: string };

export default function TabViewer({ fileUrl }: Props) {
  const [currentFile, setCurrentFile] = useState<string>(fileUrl);
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [currentSongName, setCurrentSongName] = useState<string>('Unknown Song');
  const [currentArtist, setCurrentArtist] = useState<string>('Unknown Artist');
  
  // allow external load requests
  useEffect(() => {
    const onLoad = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const url = typeof d.url === 'string' ? d.url : d.file;
      const trackId = typeof d.trackId === 'number' ? d.trackId : null;
      const songName = typeof d.songName === 'string' ? d.songName : 'Unknown Song';
      const artist = typeof d.artist === 'string' ? d.artist : 'Unknown Artist';
      if (typeof url === 'string' && url) {
        setCurrentFile(url);
        setCurrentTrackId(trackId);
        setCurrentSongName(songName);
        setCurrentArtist(artist);
      }
    };
    window.addEventListener('load-song', onLoad as EventListener);
    return () => window.removeEventListener('load-song', onLoad as EventListener);
  }, []);
  const hostRef     = useRef<HTMLDivElement | null>(null);   // alphaTab host
  const viewportRef = useRef<HTMLDivElement | null>(null);   // scroll container
  const apiRef      = useRef<any>(null);
  const trackIdxRef = useRef<number | null>(null);

  const { live, score, validity, validityRef, scoreRef, noteResults } = usePitchScorer(currentTrackId);

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

    // Use the highlighted beat instead of cursor (since cursor is hidden)
    const el = host.querySelector('.at-highlight') as HTMLElement;

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
        // Use trackIdxRef as primary source of truth (updated when track is selected)
        if (trackIdxRef.current !== null && api.score?.tracks) {
          const track = api.score.tracks[trackIdxRef.current];
          instrumentName = track?.name || 'Unknown Instrument';
        }
        // Fallback to trackIdx state variable
        else if (trackIdx !== null && api.score?.tracks) {
          const track = api.score.tracks[trackIdx];
          instrumentName = track?.name || 'Unknown Instrument';
        }
        // Fallback to first track in score
        else if (api.score?.tracks && api.score.tracks.length > 0) {
          instrumentName = api.score.tracks[0]?.name || 'Unknown Instrument';
        }
      } catch (e) {
        console.error('[TabViewer] Error getting track:', e);
      }

      // Use song name from state (passed via load-song event)
      const songName = currentSongName;

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
          trackId: currentTrackId,
        }
      }));
    });

    // --- Emit expected notes AND keep cursor in view ---
    api.playedBeatChanged?.on?.((beatOrArgs: any) => {
      const beat = beatOrArgs?.beat ?? beatOrArgs;
      const notesArr = Array.isArray(beat?.notes) ? beat.notes
                    : Array.isArray(beat?.beat?.notes) ? beat.beat.notes
                    : [];
      
      // Filter out ghost notes, dead notes, and extract pitches
      const pitches: number[] = notesArr
        .filter((n: any) => {
          // Skip ghost notes (grace notes shown in parentheses)
          if (n?.isGhost === true) return false;
          // Skip dead notes (muted/percussive notes marked with 'X')
          if (n?.isDead === true) return false;
          return true;
        })
        .map((n: any) => n?.realValue)
        .filter((x: any) => typeof x === 'number' && isFinite(x));

      // Send as nested array - single chord = [[60, 64, 67]], single note = [[60]]
      const chords: number[][] = pitches.length > 0 ? [pitches] : [];

      const tSec =
        typeof api.timePosition === 'function' ? api.timePosition()
      : typeof api.timePosition === 'number'   ? api.timePosition
      : 0;

      // Check if this is the first beat of the song (beat 1, bar 1)
      // Beat objects have index property (0-based) and voice.bar.index
      const beatIndex = beat?.index ?? beat?.beat?.index ?? -1;
      const barIndex = beat?.voice?.bar?.index ?? beat?.beat?.voice?.bar?.index ?? -1;
      const isFirstBeat = beatIndex === 0 && barIndex === 0;
      
      // Create a unique beat identifier: barIndex * 1000 + beatIndex
      // This ensures each beat has a unique index across the entire song
      const uniqueBeatIndex = barIndex >= 0 && beatIndex >= 0 ? barIndex * 1000 + beatIndex : -1;

      // Store current beat info for coloring
      previousBeatRef.current = barIndex >= 0 && beatIndex >= 0 
        ? { barIndex, beatIndex, uniqueIndex: uniqueBeatIndex }
        : null;

      window.dispatchEvent(new CustomEvent('tab-expected', {
        detail: { tSec, chords, xPx: beat?.x ?? 0, isFirstBeat, beatIndex: uniqueBeatIndex }
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

  // Track previous beat to apply colors after it's no longer highlighted
  const previousBeatRef = useRef<{ barIndex: number; beatIndex: number; uniqueIndex: number } | null>(null);
  const appliedColorsRef = useRef<Set<number>>(new Set()); // Track which beats we've already colored
  const noteResultsRef = useRef(noteResults); // Ref for synchronous access in MutationObserver

  // Keep ref in sync with state
  useEffect(() => {
    noteResultsRef.current = noteResults;
  }, [noteResults]);

  // Apply color classes to notes based on noteResults using MutationObserver
  useEffect(() => {
    if (!hostRef.current) return;

    const host = hostRef.current;
    
    // Use MutationObserver to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as Element;
          
          const oldClasses = mutation.oldValue || '';
          const hasHighlightNow = target.classList.contains('at-highlight');
          const hadHighlightBefore = oldClasses.includes('at-highlight');
          
          // When highlight is ADDED, store the current beat index on the element
          if (!hadHighlightBefore && hasHighlightNow && previousBeatRef.current) {
            const uniqueBeatIndex = previousBeatRef.current.uniqueIndex;
            target.setAttribute('data-beat-idx', String(uniqueBeatIndex));
          }
          
          // When highlight is REMOVED, apply color based on stored beat index (with delay)
          if (hadHighlightBefore && !hasHighlightNow) {
            const beatIdxStr = target.getAttribute('data-beat-idx');
            
            if (beatIdxStr) {
              const uniqueBeatIndex = parseInt(beatIdxStr, 10);
              
              // Wait a bit for noteResults to be updated (missed notes are marked when next beat starts)
              setTimeout(() => {
                // Use ref for synchronous access to latest noteResults
                const currentNoteResults = noteResultsRef.current;
                
                if (currentNoteResults.has(uniqueBeatIndex) && !appliedColorsRef.current.has(uniqueBeatIndex)) {
                  const beatNoteResults = currentNoteResults.get(uniqueBeatIndex)!;
                  
                  // Determine overall result for this beat
                  // For chords: green if ANY note was hit correctly
                  // For single notes: must be correct to be green
                  let correctCount = 0;
                  let totalCount = 0;
                  beatNoteResults.forEach((result) => {
                    totalCount++;
                    if (result === 'correct') correctCount++;
                  });
                  
                  // Apply color class to the element and its children
                  // Green if at least one note was correct
                  if (correctCount > 0) {
                    target.classList.add('note-correct');
                  } else if (totalCount > 0) {
                    target.classList.add('note-incorrect');
                  }
                  
                  // Mark this beat as colored
                  appliedColorsRef.current.add(uniqueBeatIndex);
                }
              }, 50); // Small delay to allow missed notes to be marked
              
              // Clean up the data attribute (after delay)
              setTimeout(() => target.removeAttribute('data-beat-idx'), 100);
            }
          }
        }
      });
    });

    // Observe the entire host for class changes
    observer.observe(host, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class'],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [noteResults]);

  // Clear note colors when playback resets
  useEffect(() => {
    const clearColors = () => {
      appliedColorsRef.current.clear();
      previousBeatRef.current = null;
      
      // Force alphaTab to re-render to ensure all DOM elements are fresh
      const api = apiRef.current;
      if (api && trackIdxRef.current !== null) {
        setTimeout(() => {
          renderSelectedTrack(trackIdxRef.current!);
        }, 0);
      }
    };

    window.addEventListener('reset-scorer', clearColors);
    window.addEventListener('load-song', clearColors);
    
    return () => {
      window.removeEventListener('reset-scorer', clearColors);
      window.removeEventListener('load-song', clearColors);
    };
  }, []);

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
      // Check if starting from beginning (position ~0)
      const timePos = typeof a.timePosition === 'function' ? a.timePosition() 
                    : typeof a.timePosition === 'number' ? a.timePosition : 0;
      const startedFromBeginning = timePos < 1; // within first second
      
      // Only reset score state when starting from beginning (not when resuming from pause)
      if (startedFromBeginning) {
        window.dispatchEvent(new CustomEvent('reset-scorer'));
      }
      
      window.dispatchEvent(new CustomEvent('playback-started', { 
        detail: { fromBeginning: startedFromBeginning } 
      }));
      
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
  window.dispatchEvent(new CustomEvent('tab-status', { 
    detail: { score, live, isPlaying, tracks, trackIdx, currentFile } 
  }));
}, [score, live, isPlaying, tracks, trackIdx, currentFile]);

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
