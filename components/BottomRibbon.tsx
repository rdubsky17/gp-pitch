'use client';
import React from 'react';
import PitchMeter from '@/components/PitchMeter';

export default function BottomRibbon() {
  return (
    <>
      {/* Push page content up so the ribbon doesn’t cover it */}
      <div style={{ height: 'var(--ribbon-h, 120px)' }} />

      <div
        style={{
          position:'fixed', left:0, right:0, bottom:0, zIndex:1000,
          background:'rgba(0,0,0,0.9)', color:'#fff',
          boxShadow:'0 -6px 16px rgba(0,0,0,0.35)',
          padding:'10px 14px'
        }}
      >
        <PitchMeter variant="ribbon" />
      </div>
    </>
  );
}
