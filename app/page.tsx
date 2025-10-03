'use client';
import TabViewer from '@/components/TabViewer';
import BottomRibbon from '@/components/BottomRibbon';

export default function Page() {
  return (
    <main style={{ display:'grid', gap:16, padding:16 }}>
      <TabViewer fileUrl="/songs/Gorillaz-Feel Good Inc.-09-23-2025.gp" />
      <BottomRibbon />
    </main>
  );
}

// public\songs\Gorillaz-Feel Good Inc.-09-23-2025.gp
//