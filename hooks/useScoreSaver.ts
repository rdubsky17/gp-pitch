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
}

export function useScoreSaver() {
  const lastSaveRef = useRef<number>(0);

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

      // Get track ID from filename
      const trackId = getTrackIdFromFile(currentFile);
      if (!trackId) {
        console.error('[useScoreSaver] Could not determine track ID from file:', currentFile);
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
            trackId,
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
    return () => {
      window.removeEventListener('song-finished-with-data', handleSongFinished as EventListener);
    };
  }, []);
}

// Helper to extract track ID from filename
// This maps the file path to a database track ID
function getTrackIdFromFile(filePath: string): number | null {
  // For now, we'll use a simple mapping based on the filename
  // In a real app, you'd want to store this mapping in your database or config
  const fileToTrackId: Record<string, number> = {
    '/songs/Gorillaz-Feel Good Inc.-09-23-2025.gp': 1,
    '/songs/Muse-Hysteria-09-20-2025.gp': 2,
    '/songs/Red Hot Chili Peppers-Aeroplane-09-11-2025.gp': 3,
    '/songs/Jackson 5-I Want You Back-11-19-2025.gp': 4,
    '/songs/Radiohead-Creep-12-05-2025.gp': 5,
    '/songs/Pink Floyd-Money-10-26-2025.gp': 6,
    '/songs/Red Hot Chili Peppers-Dark Necessities-08-25-2025.gp': 7,
    "/songs/Red Hot Chili Peppers-Can't Stop-12-10-2025.gp": 8,
  };

  return fileToTrackId[filePath] ?? null;
}
