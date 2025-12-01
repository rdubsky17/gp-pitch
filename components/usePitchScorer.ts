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

export default function usePitchScorer() {
  // live readout for UI
  const [live, setLive] = useState<{ err: number; ok: boolean; target: number | null }>({
    err: 0,
    ok: false,
    target: null,
  });
  // aggregate score
  const [score, setScore] = useState({ hits: 0, total: 0 });

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

  // pending notes for the *current beat*: midi -> remaining count
  const pendingRef = useRef<Map<number, number>>(new Map());
  // sliding window of recent detection frames
  const bufRef = useRef<Frame[]>([]);
  // cooldown to avoid double-awarding
  const cooldownRef = useRef<number>(0);

  // tuning for stability
  const tolerance = 25;   // cents window for "in tune"
  const windowSize = 10;  // frames to consider
  const needOK = 6;       // need at least 6/10 frames in tune
  const cooldownMs = 200; // minimal time between awards

  useEffect(() => {
    const onExpected = (e: Event) => {
      const { pitches, isFirstBeat } = (e as CustomEvent).detail as { tSec: number; pitches: number[]; isFirstBeat?: boolean };

      // Build pending-map (midi -> count) for this beat
      const m = new Map<number, number>();
      (pitches ?? []).forEach((p) => m.set(p, (m.get(p) ?? 0) + 1));
      pendingRef.current = m;

      // Mark as started when first beat arrives, but ONLY if it's beat 1 bar 1
      if (!validity.started && pitches && pitches.length > 0) {
        console.log('[usePitchScorer] First beat detected. isFirstBeat:', isFirstBeat);
        if (isFirstBeat === true) {
          console.log('[usePitchScorer] Setting started=true, playback started from beat 1');
          setValidity((v) => ({ ...v, started: true }));
        } else {
          console.log('[usePitchScorer] Setting seeked=true, playback did NOT start from beat 1');
          setValidity((v) => ({ ...v, seeked: true }));
        }
      }

      // Increase TOTAL by #notes in beat
      const notesInBeat = pitches?.length ?? 0;
      if (notesInBeat > 0) {
        setScore((s) => ({ ...s, total: s.total + notesInBeat }));
      }

      // Reset per-beat state
      bufRef.current = [];
      cooldownRef.current = 0;
      setLive({ err: 0, ok: false, target: null });
    };

    const onDetected = (e: Event) => {
      const { hz } = (e as CustomEvent).detail as { tSec: number; hz: number };
      const pending = pendingRef.current;

      if (!pending || pending.size === 0) {
        bufRef.current = [];
        setLive({ err: 0, ok: false, target: null });
        return;
      }

      // Choose nearest *still-pending* target (octave-agnostic)
      let bestTarget: number | null = null;
      let bestErr = Number.POSITIVE_INFINITY;

      for (const midi of pending.keys()) {
        const ce = Math.abs(centsErr(hz, midi)); // <-- folded into [-600,+600)
        if (ce < bestErr) {
          bestErr = ce;
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

      setLive({ err: bestErr, ok: stable, target: bestTarget });

      // Award one note when we first reach stability for a pending target
      if (stable && now >= cooldownRef.current) {
        const remaining = pending.get(bestTarget) ?? 0;
        if (remaining > 0) {
          pending.set(bestTarget, remaining - 1);
          if (pending.get(bestTarget) === 0) pending.delete(bestTarget);

          setScore((s) => ({ ...s, hits: s.hits + 1 }));

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
      setLive({ err: 0, ok: false, target: null });
      setScore({ hits: 0, total: 0 });
      setValidity({ started: false, paused: false, trackChanged: false, manualStop: false, seeked: false });
    };

    window.addEventListener('reset-scorer', resetAll as EventListener);
    window.addEventListener('stop-alpha', resetAll as EventListener);
    window.addEventListener('load-song', resetAll as EventListener);
    return () => {
      window.removeEventListener('reset-scorer', resetAll as EventListener);
      window.removeEventListener('stop-alpha', resetAll as EventListener);
      window.removeEventListener('load-song', resetAll as EventListener);
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

  return { live, score, validity, validityRef, scoreRef };
}
