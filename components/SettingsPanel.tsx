'use client';
import React from 'react';
import { useSettings } from './SettingsContext';

const METHOD_OPTIONS = ['yin', 'yinfft', 'mcomb', 'fcomb', 'schmitt'] as const;
const WIN_OPTIONS = [2048, 4096, 8192];
const HOP_OPTIONS = [256, 512, 1024, 2048];

export default function SettingsPanel() {
  const { devices, deviceId, setDeviceId, channelIndex, setChannelIndex, method, setMethod, win, setWin, hop, setHop } = useSettings();

  return (
    <div style={{ padding: 12, background: '#fff', color: '#111', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.15)', minWidth: 420 }}>
      <h3 style={{ marginTop: 0 }}>Audio Settings</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <label>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Input Device</div>
          <select value={deviceId} onChange={e => setDeviceId(e.target.value)} style={{ width: '100%' }}>
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Channel</div>
          <select value={channelIndex} onChange={e => setChannelIndex(parseInt(e.target.value, 10))} style={{ width: '100%' }}>
            <option value={0}>Ch 1 (Left)</option>
            <option value={1}>Ch 2 (Right)</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Method</div>
          <select value={method} onChange={e => setMethod(e.target.value as any)} style={{ width: '100%' }}>
            {METHOD_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Win</div>
          <select value={win} onChange={e => setWin(parseInt(e.target.value, 10))} style={{ width: '100%' }}>
            {WIN_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>

        <label style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Hop</div>
          <select value={hop} onChange={e => setHop(parseInt(e.target.value, 10))} style={{ width: '100%' }}>
            {HOP_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
