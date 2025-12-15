'use client';

import { useEffect, useRef } from 'react';

interface SaveScoreParams {
  score: { hits: number; total: number };
  validity: {
    started: boolean;
    paused: boolean;
    trackChanged: boolean;
    manualStop: boolean;
    seeked: boolean;
  };
  currentFile: string;
  trackName: string;
  songName: string;
  trackId?: number | null;
}

export function useScoreSaver(trackId: number | null = null) {
  const lastSaveRef = useRef<number>(0);
  const trackIdRef = useRef<number | null>(trackId);
  
  useEffect(() => {
    trackIdRef.current = trackId;
  }, [trackId]);

  useEffect(() => {
    const handleSongFinished = async (e: Event) => {
      const detail = (e as CustomEvent).detail as SaveScoreParams | undefined;
      
      if (!detail) {
        console.warn('[useScoreSaver] No detail provided in song-finished event');
        return;
      }

      const { score, validity, currentFile, trackName, songName } = detail;

      // Check if play was valid (no pauses, stops, seeks, or track changes)
      const isValid =
        validity.started &&
        !validity.paused &&
        !validity.trackChanged &&
        !validity.manualStop &&
        !validity.seeked;

      if (!isValid) {
        console.log('[useScoreSaver] Play session was invalid, not saving:', validity);
        return;
      }

      // Ensure we have a valid score
      if (!score.total || score.total === 0) {
        console.log('[useScoreSaver] No notes to score, not saving');
        return;
      }

      // Calculate percentage
      const percentage = Math.round((score.hits / score.total) * 100);

      // Get track ID from event detail or from hook parameter
      const currentTrackId = detail.trackId ?? trackIdRef.current;
      if (!currentTrackId) {
        console.error('[useScoreSaver] Could not determine track ID. Not provided in event or hook parameter.');
        return;
      }

      // Prevent duplicate saves within 5 seconds
      const now = Date.now();
      if (now - lastSaveRef.current < 5000) {
        console.log('[useScoreSaver] Duplicate save attempt, skipping');
        return;
      }
      lastSaveRef.current = now;

      // Dispatch event to show modal with score data
      window.dispatchEvent(
        new CustomEvent('score-ready-to-save', {
          detail: {
            percentage,
            hits: score.hits,
            total: score.total,
            songName,
            instrument: trackName,
            trackId: currentTrackId,
          },
        })
      );
    };

    const handleConfirmSave = async (e: Event) => {
      const data = (e as CustomEvent).detail as {
        percentage: number;
        hits: number;
        total: number;
        songName: string;
        instrument: string;
        trackId: number;
      };

      try {
        const response = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: data.trackId,
            instrument: data.instrument,
            value: data.percentage,
            hits: data.hits,
            total: data.total,
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to save score';
          
          // Show error to user
          if (response.status === 401) {
            errorMessage = 'Login Required to Save Scores';
          } else {
            try {
              const error = await response.json();
              errorMessage = error.error || errorMessage;
              console.error('[useScoreSaver] Failed to save score:', error);
            } catch (e) {
              console.error('[useScoreSaver] Failed to parse error response');
            }
          }
          
          window.dispatchEvent(
            new CustomEvent('score-save-error', {
              detail: { message: errorMessage },
            })
          );
          return;
        }

        const result = await response.json();
        console.log('[useScoreSaver] Score saved successfully:', result);
      } catch (error) {
        console.error('[useScoreSaver] Error saving score:', error);
      }
    };

    window.addEventListener('song-finished-with-data', handleSongFinished as EventListener);
    window.addEventListener('confirm-save-score', handleConfirmSave as EventListener);
    return () => {
      window.removeEventListener('song-finished-with-data', handleSongFinished as EventListener);
      window.removeEventListener('confirm-save-score', handleConfirmSave as EventListener);
    };
  }, []);
}
