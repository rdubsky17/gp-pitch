'use client';

import { useEffect, useRef, useState } from 'react';

const hzToMidi = (hz:number) => 69 + 12 * Math.log2(hz / 440);
const centsErr = (hz:number, midi:number) => (hz <= 0 ? 1e9 : 100 * (hzToMidi(hz) - midi));

type Frame = { t:number; ok:boolean; err:number; target:number };

export default function usePitchScorer() {
  // live readout for UI
  const [live, setLive] = useState<{err:number, ok:boolean, target:number|null}>({
    err:0, ok:false, target:null
  });
  // aggregate score
  const [score, setScore] = useState({ hits:0, total:0 });

  // pending notes for the *current beat*: midi -> remaining count
  const pendingRef = useRef<Map<number, number>>(new Map());
  // sliding window of recent detection frames
  const bufRef = useRef<Frame[]>([]);
  // cooldown to avoid double-awarding
  const cooldownRef = useRef<number>(0);

  // tuning for stability
  const tolerance = 25;   // cents
  const windowSize = 10;  // frames
  const needOK = 6;       // need at least 6/10 frames within tolerance
  const cooldownMs = 200; // refractory period after awarding, in ms

  useEffect(() => {
    const onExpected = (e: Event) => {
      const { pitches } = (e as CustomEvent).detail as { tSec:number; pitches:number[] };

      // Build pending-map (midi -> count) for this beat
      const m = new Map<number, number>();
      (pitches ?? []).forEach((p) => m.set(p, (m.get(p) ?? 0) + 1));
      pendingRef.current = m;

      // Increase TOTAL by #notes in beat
      const notesInBeat = pitches?.length ?? 0;
      if (notesInBeat > 0) {
        setScore(s => ({ ...s, total: s.total + notesInBeat }));
      }

      // Reset per-beat state
      bufRef.current = [];
      cooldownRef.current = 0;
      setLive({ err:0, ok:false, target:null });
    };

    const onDetected = (e: Event) => {
      const { hz } = (e as CustomEvent).detail as { tSec:number; hz:number };
      const pending = pendingRef.current;

      // Nothing to grade (rests or no expected notes)
      if (!pending || pending.size === 0) {
        bufRef.current = [];
        setLive({ err:0, ok:false, target:null });
        return;
      }

      // Choose nearest *still-pending* target
      let bestTarget: number | null = null;
      let bestErr = Number.POSITIVE_INFINITY;
      for (const midi of pending.keys()) {
        const ce = Math.abs(centsErr(hz, midi));
        if (ce < bestErr) {
          bestErr = ce;
          bestTarget = midi;
        }
      }

      if (bestTarget === null || !isFinite(bestErr)) {
        bufRef.current = [];
        setLive({ err:0, ok:false, target:null });
        return;
      }

      const okNow = bestErr <= tolerance;

      // Slide window
      const now = performance.now();
      bufRef.current.push({ t: now, ok: okNow, err: bestErr, target: bestTarget });
      if (bufRef.current.length > windowSize) bufRef.current.shift();

      // Stability check for *current* target
      const okCount = bufRef.current.reduce((a,b) => a + (b.ok ? 1 : 0), 0);
      const stable = okCount >= needOK;

      setLive({ err: bestErr, ok: stable, target: bestTarget });

      // Award logic: one credit at a time, and only for targets still pending
      if (stable && now >= cooldownRef.current) {
        const remaining = pending.get(bestTarget) ?? 0;
        if (remaining > 0) {
          pending.set(bestTarget, remaining - 1);
          if (pending.get(bestTarget) === 0) pending.delete(bestTarget);

          setScore(s => ({ ...s, hits: s.hits + 1 }));

          // small cooldown + reset window so the next note requires fresh stability
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
  }, []);

  return { live, score };
}
