'use client';
import TabViewer from '@/components/TabViewer';
import PitchMeter from '@/components/PitchMeter';

export default function ClientHome() {
  return (
    <main style={{ display:'grid', gap:16, padding:16 }}>
      <TabViewer fileUrl="/songs/my-song.gpx" />
      <PitchMeter />
    </main>
  );
}
