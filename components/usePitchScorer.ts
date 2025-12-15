'use client';

import { useEffect, useRef, useState } from 'react';

// MIDI/freq helpers
const hzToMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440);

// Raw cents error (can be > 1200 if octave off)
const rawCentsErr = (hz: number, midi: number) =>
  hz <= 0 ? 1e9 : 100 * (hzToMidi(hz) - midi);

// Fold any cents error into [-600, +600)
//   e.g. +1200 -> 0,  +700 -> -500,  -1300 -> -100
const fold1200 = (cents: number) => {
  if (!isFinite(cents)) return 1e9;
  const m = 1200;
  return ((cents + 600) % m + m) % m - 600;
};

// Final cents error we use for scoring (octave-agnostic)
const centsErr = (hz: number, midi: number) => fold1200(rawCentsErr(hz, midi));

type Frame = { t: number; ok: boolean; err: number; target: number };

// Track result for each beat: beatIndex -> map of midi -> 'correct' | 'incorrect' | 'missed'
export type NoteResult = 'correct' | 'incorrect' | 'missed';
export type BeatResults = Map<number, Map<number, NoteResult>>;

export default function usePitchScorer(trackId: number | null = null) {
  // live readout for UI
  const [live, setLive] = useState<{ err: number; ok: boolean; target: number | null }>({
    err: 0,
    ok: false,
    target: null,
  });
  // aggregate score
  const [score, setScore] = useState({ hits: 0, total: 0 });
  
  // Track note results per beat for coloring
  const [noteResults, setNoteResults] = useState<BeatResults>(new Map());

  // Store trackId in ref for access in event handlers
  const trackIdRef = useRef<number | null>(trackId);
  
  useEffect(() => {
    trackIdRef.current = trackId;
  }, [trackId]);

  // validity tracking for database persistence
  const [validity, setValidity] = useState({
    started: false,
    paused: false,
    trackChanged: false,
    manualStop: false,
    seeked: false,
  });
  
  // Use refs to ensure we always have latest values in event handlers
  const validityRef = useRef(validity);
  const scoreRef = useRef(score);
  
  useEffect(() => {
    validityRef.current = validity;
  }, [validity]);
  
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Track if playback started from beginning (to handle songs with initial rests)
  const startedFromBeginningRef = useRef(false);

  // pending notes for the *current beat*: midi -> remaining count
  const pendingRef = useRef<Map<number, number>>(new Map());
  // sliding window of recent detection frames
  const bufRef = useRef<Frame[]>([]);
  // cooldown to avoid double-awarding
  const cooldownRef = useRef<number>(0);
  // Track last expected note for continuous intonation feedback
  const lastTargetRef = useRef<number | null>(null);
  
  // Track current beat index for result recording
  const currentBeatIndexRef = useRef<number>(0);

  // tuning for stability
  const tolerance = 25;   // cents window for "in tune"
  const windowSize = 10;  // frames to consider
  const needOK = 6;       // need at least 6/10 frames in tune
  const cooldownMs = 200; // minimal time between awards

  useEffect(() => {
    const onExpected = (e: Event) => {
      const { chords, isFirstBeat, beatIndex } = (e as CustomEvent).detail as { tSec: number; chords: number[][]; isFirstBeat?: boolean; beatIndex?: number };

      // Before processing new beat, mark any remaining pending notes from previous beat as missed
      const prevBeatIdx = currentBeatIndexRef.current;
      const prevPending = pendingRef.current;
      if (prevPending.size > 0 && typeof prevBeatIdx === 'number') {
        setNoteResults((prev) => {
          const newResults = new Map(prev);
          if (!newResults.has(prevBeatIdx)) {
            newResults.set(prevBeatIdx, new Map());
          }
          const beatMap = newResults.get(prevBeatIdx)!;
          for (const [midi] of prevPending) {
            // Only mark as missed if not already marked as correct
            if (!beatMap.has(midi)) {
              beatMap.set(midi, 'missed');
            }
          }
          return newResults;
        });
      }

      // Store current beat index
      if (typeof beatIndex === 'number') {
        currentBeatIndexRef.current = beatIndex;
      }

      // Build pending-map for this beat
      // For CHORDS (multiple notes): Store all notes but mark it as a chord unit
      // For SINGLE notes: Store the note
      // This ensures only 1 hit per chord regardless of octaves
      const m = new Map<number, number>();
      (chords ?? []).forEach((chord) => {
        if (chord.length > 1) {
          // It's a chord - store all notes but they share a single "pending" count
          // We'll use a special marker to indicate this is a chord unit
          chord.forEach((p) => m.set(p, 0.5)); // 0.5 means "part of a chord"
        } else if (chord.length === 1) {
          // Single note
          m.set(chord[0], (m.get(chord[0]) ?? 0) + 1);
        }
      });
      pendingRef.current = m;
      
      // Store first expected note as last target for continuous intonation display
      if (m.size > 0) {
        lastTargetRef.current = Array.from(m.keys())[0];
      }

      // Mark as started when first beat with notes arrives
      // Valid if: beat 1 bar 1, OR playback started from beginning (handles songs with initial rests)
      const hasNotes = chords && chords.length > 0 && chords.some(chord => chord.length > 0);
      if (!validity.started && hasNotes) {
        const isValidStart = isFirstBeat === true || startedFromBeginningRef.current === true;
        console.log('[usePitchScorer] First beat detected. isFirstBeat:', isFirstBeat, 'startedFromBeginning:', startedFromBeginningRef.current, 'isValidStart:', isValidStart);
        if (isValidStart) {
          console.log('[usePitchScorer] Setting started=true, playback started from beginning');
          setValidity((v) => ({ ...v, started: true }));
          startedFromBeginningRef.current = false; // consume flag
        } else {
          console.log('[usePitchScorer] Setting seeked=true, playback did NOT start from beginning');
          setValidity((v) => ({ ...v, seeked: true }));
        }
      }

      // Increase TOTAL by number of chord units (1 per chord, regardless of chord size)
      const chordUnits = (chords ?? []).filter(chord => chord.length > 0).length;
      if (chordUnits > 0) {
        setScore((s) => ({ ...s, total: s.total + chordUnits }));
      }

      // Reset per-beat state
      bufRef.current = [];
      cooldownRef.current = 0;
    };

    const onDetected = (e: Event) => {
      const { hz } = (e as CustomEvent).detail as { tSec: number; hz: number };
      const pending = pendingRef.current;

      // If no valid pitch detected (threshold: 30 Hz), clear display
      // This prevents showing error values when no input or just noise is present
      // Note: Bass low E is ~41 Hz, so threshold must be below that
      if (hz <= 30) {
        bufRef.current = [];
        setLive({ err: 0, ok: false, target: null });
        return;
      }

      // If no pending notes, use last target to continue showing intonation
      if (!pending || pending.size === 0) {
        if (lastTargetRef.current !== null) {
          const err = centsErr(hz, lastTargetRef.current); // Keep signed value
          const okNow = Math.abs(err) <= tolerance;
          
          // Update sliding window for display stability
          const now = performance.now();
          bufRef.current.push({ t: now, ok: okNow, err: Math.abs(err), target: lastTargetRef.current });
          if (bufRef.current.length > windowSize) bufRef.current.shift();
          
          const okCount = bufRef.current.reduce((a, b) => a + (b.ok ? 1 : 0), 0);
          const stable = okCount >= needOK;
          
          setLive({ err, ok: stable, target: lastTargetRef.current });
        } else {
          bufRef.current = [];
          setLive({ err: 0, ok: false, target: null });
        }
        return;
      }

      // Choose nearest *still-pending* target (octave-agnostic)
      let bestTarget: number | null = null;
      let bestErr = Number.POSITIVE_INFINITY;
      let bestSignedErr = 0;

      for (const midi of pending.keys()) {
        const signedErr = centsErr(hz, midi); // Keep signed value
        const ce = Math.abs(signedErr);
        if (ce < bestErr) {
          bestErr = ce;
          bestSignedErr = signedErr;
          bestTarget = midi;
        }
      }

      if (bestTarget === null || !isFinite(bestErr)) {
        bufRef.current = [];
        setLive({ err: 0, ok: false, target: null });
        return;
      }

      const okNow = bestErr <= tolerance;

      // Slide window
      const now = performance.now();
      bufRef.current.push({ t: now, ok: okNow, err: bestErr, target: bestTarget });
      if (bufRef.current.length > windowSize) bufRef.current.shift();

      // Stability over the window
      const okCount = bufRef.current.reduce((a, b) => a + (b.ok ? 1 : 0), 0);
      const stable = okCount >= needOK;

      setLive({ err: bestSignedErr, ok: stable, target: bestTarget });

      // Award one note when we first reach stability for a pending target
      if (stable && now >= cooldownRef.current) {
        const remaining = pending.get(bestTarget) ?? 0;
        
        // Check if this is part of a chord (marked with 0.5)
        const isChordNote = remaining === 0.5;
        
        if (remaining > 0) {
          // For chord notes (0.5), clear ALL chord notes from pending at once
          if (isChordNote) {
            // Find all notes with 0.5 (chord members) and clear them
            const chordNotes: number[] = [];
            for (const [midi, count] of pending.entries()) {
              if (count === 0.5) {
                chordNotes.push(midi);
              }
            }
            chordNotes.forEach(midi => pending.delete(midi));
            
            // Award 1 hit for the entire chord
            setScore((s) => ({ ...s, hits: s.hits + 1 }));
            
            // Mark ALL chord notes as correct in results
            const beatIdx = currentBeatIndexRef.current;
            setNoteResults((prev) => {
              const newResults = new Map(prev);
              if (!newResults.has(beatIdx)) {
                newResults.set(beatIdx, new Map());
              }
              const beatMap = newResults.get(beatIdx)!;
              chordNotes.forEach(midi => beatMap.set(midi, 'correct'));
              return newResults;
            });
          } else {
            // Single note - original logic
            pending.set(bestTarget, remaining - 1);
            if (pending.get(bestTarget) === 0) pending.delete(bestTarget);

            setScore((s) => ({ ...s, hits: s.hits + 1 }));
            
            // Mark this note as correct in the current beat
            const beatIdx = currentBeatIndexRef.current;
            setNoteResults((prev) => {
              const newResults = new Map(prev);
              if (!newResults.has(beatIdx)) {
                newResults.set(beatIdx, new Map());
              }
              newResults.get(beatIdx)!.set(bestTarget, 'correct');
              return newResults;
            });
          }

          cooldownRef.current = now + cooldownMs;
          bufRef.current = [];
        }
      }
    };

    window.addEventListener('tab-expected', onExpected as any);
    window.addEventListener('pitch-detected', onDetected as any);
    return () => {
      window.removeEventListener('tab-expected', onExpected as any);
      window.removeEventListener('pitch-detected', onDetected as any);
    };
  }, [validity.started]);

  // Reset live/score when playback stops or a new song is loaded
  useEffect(() => {
    const resetAll = () => {
      console.log('[usePitchScorer] Resetting all state (score, validity, pending notes)');
      pendingRef.current = new Map();
      bufRef.current = [];
      cooldownRef.current = 0;
      startedFromBeginningRef.current = false;
      currentBeatIndexRef.current = 0;
      lastTargetRef.current = null;
      setLive({ err: 0, ok: false, target: null });
      setScore({ hits: 0, total: 0 });
      setNoteResults(new Map());
      setValidity({ started: false, paused: false, trackChanged: false, manualStop: false, seeked: false });
    };

    const onPlaybackStarted = (e: Event) => {
      const { fromBeginning } = (e as CustomEvent).detail || {};
      startedFromBeginningRef.current = fromBeginning === true;
      console.log('[usePitchScorer] Playback started. fromBeginning:', fromBeginning);
    };

    window.addEventListener('reset-scorer', resetAll as EventListener);
    window.addEventListener('stop-alpha', resetAll as EventListener);
    window.addEventListener('load-song', resetAll as EventListener);
    window.addEventListener('playback-started', onPlaybackStarted as EventListener);
    return () => {
      window.removeEventListener('reset-scorer', resetAll as EventListener);
      window.removeEventListener('stop-alpha', resetAll as EventListener);
      window.removeEventListener('load-song', resetAll as EventListener);
      window.removeEventListener('playback-started', onPlaybackStarted as EventListener);
    };
  }, []);

  // Track validity events
  useEffect(() => {
    const onPause = () => setValidity((v) => ({ ...v, paused: true }));
    const onStop = () => setValidity((v) => ({ ...v, manualStop: true }));
    const onTrackChange = () => setValidity((v) => ({ ...v, trackChanged: true }));
    const onSeek = () => setValidity((v) => ({ ...v, seeked: true }));

    window.addEventListener('pause-alpha', onPause as EventListener);
    window.addEventListener('stop-alpha', onStop as EventListener);
    window.addEventListener('select-track', onTrackChange as EventListener);
    window.addEventListener('seek-alpha', onSeek as EventListener);

    return () => {
      window.removeEventListener('pause-alpha', onPause as EventListener);
      window.removeEventListener('stop-alpha', onStop as EventListener);
      window.removeEventListener('select-track', onTrackChange as EventListener);
      window.removeEventListener('seek-alpha', onSeek as EventListener);
    };
  }, []);

  return { live, score, validity, validityRef, scoreRef, noteResults };
}
