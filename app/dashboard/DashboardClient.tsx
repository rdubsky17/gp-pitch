'use client';

import TabViewer from '@/components/TabViewer';
import ScoreConfirmModal from '@/components/ScoreSavedToast';
import { useGuestMode } from '@/hooks/useGuestMode';
import { useScoreSaver } from '@/hooks/useScoreSaver';

export default function DashboardClient() {
  const { isGuestMode } = useGuestMode();
  
  // Initialize score saving hook
  useScoreSaver();

  return (
    <main style={{ display: 'grid', gap: 16, padding: 16 }}>
      {isGuestMode && (
        <div style={{ padding: 8, background: '#f0f0f0', borderRadius: 4, marginBottom: 8, color: '#000' }}>
          You are in guest mode.{' '}
          <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
            Sign in
          </a>{' '}
          to access all features.
        </div>
      )}

      <TabViewer fileUrl="/songs/Red Hot Chili Peppers-Aeroplane-09-11-2025.gp" />
      <ScoreConfirmModal />
    </main>
  );
}

