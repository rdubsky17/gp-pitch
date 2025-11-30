import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <DashboardClient />
    </Suspense>
  );
}

