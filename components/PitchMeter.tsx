'use client';
import { useEffect, useRef, useState } from 'react';

type Method = 'yin' | 'yinfft' | 'mcomb' | 'fcomb' | 'schmitt';

const METHOD_OPTIONS: Method[] = ['yin', 'yinfft', 'mcomb', 'fcomb', 'schmitt'];
const WIN_OPTIONS = [2048, 4096, 8192];
const HOP_OPTIONS = [256, 512, 1024, 2048];

type MediaDev = { deviceId: string; label: string };

export default function PitchMeter() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const micRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [freq, setFreq] = useState(0);

  const [method, setMethod] = useState<Method>('yinfft');
  const [win, setWin] = useState<number>(4096);
  const [hop, setHop] = useState<number>(1024);

  const [devices, setDevices] = useState<MediaDev[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [channelIndex, setChannelIndex] = useState<number>(0);

  const log = (...a: any[]) => console.log('[PitchMeter]', ...a);

  useEffect(() => {
    (async () => {
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
      const all = await navigator.mediaDevices.enumerateDevices();
      const inputs = all
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || 'Audio input' }));
      setDevices(inputs);
      if (!deviceId && inputs.length) {
        const ext = inputs.find(d =>
          /focusrite|scarlett|behringer|steinberg|m-?audio|usb|interface/i.test(d.label)
        );
        setDeviceId((ext ?? inputs[0]).deviceId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hop > win) setHop(win);
  }, [win]); // eslint-disable-line

  async function buildGraph() {
    await teardown();

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    ctxRef.current = ctx;
    log('AudioContext SR', ctx.sampleRate);

    try {
      await ctx.audioWorklet.addModule('/aubio-pitch-worklet.js');
      log('worklet loaded');
    } catch (e) {
      console.error('addModule failed:', e);
      setStatus('failed to load worklet');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          channelCount: { ideal: 2 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      log('getUserMedia OK', { deviceId, channelIndex });
    } catch (e) {
      console.error('mic/device error:', e);
      setStatus('mic permission / device error');
      return;
    }

    const src = ctx.createMediaStreamSource(stream);
    micRef.current = src;

    const splitter = ctx.createChannelSplitter(2);
    src.connect(splitter);

    const node = new AudioWorkletNode(ctx, 'aubio-pitch');
    nodeRef.current = node;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gainRef.current = gain;

    splitter.connect(node, channelIndex, 0);
    node.connect(gain).connect(ctx.destination);

    node.port.onmessage = (e: MessageEvent) => {
      const m = e.data || {};
      if (m.type === 'ready') { setStatus('listening'); log('worklet ready'); }
      if (m.type === 'error') { setStatus(String(m.error)); log('worklet error', m.error); }
      if (m.type === 'pitch') {
        const hz = m.hz || 0;
        setFreq(hz);
        // Debug stream of detections (comment out if too chatty)
        // log('pitch', { tSec: ctx.currentTime, hz });
        window.dispatchEvent(new CustomEvent('pitch-detected', {
          detail: { tSec: ctx.currentTime, hz }
        }));
      }
    };

    node.port.postMessage({
      type: 'setParams',
      method,
      bufSize: win,
      hopSize: Math.min(hop, win)
    });
    log('setParams sent', { method, win, hop: Math.min(hop, win) });
  }

  async function teardown() {
    try { nodeRef.current?.port.close(); } catch {}
    try { nodeRef.current?.disconnect(); } catch {}
    try { micRef.current?.disconnect(); } catch {}
    try { gainRef.current?.disconnect(); } catch {}
    nodeRef.current = null;
    micRef.current = null;
    gainRef.current = null;

    if (ctxRef.current) {
      try { await ctxRef.current.close(); } catch {}
      ctxRef.current = null;
    }
  }

  async function start() {
    setStatus('starting…');
    log('Start clicked');
    await buildGraph();
    setRunning(true);
  }

  async function stop() {
    setStatus('stopped');
    log('Stop clicked');
    await teardown();
    setRunning(false);
    setFreq(0);
  }

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const safeHop = Math.min(hop, win);
    node.port.postMessage({ type: 'setParams', method, bufSize: win, hopSize: safeHop });
    log('live param change', { method, win, hop: safeHop });
  }, [method, win, hop]);

  useEffect(() => {
    if (!running) return;
    buildGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, channelIndex]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16, maxWidth: 900 }}>
      <h2>Pitch Meter</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 12 }}>
        <label>
          <div>Input Device</div>
          <select value={deviceId} onChange={e => setDeviceId(e.target.value)}>
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId} style={{ color: '#111' }}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div>Channel</div>
          <select value={channelIndex} onChange={e => setChannelIndex(parseInt(e.target.value, 10))}>
            <option value={0} style={{ color: '#111' }}>Ch 1 (Left)</option>
            <option value={1} style={{ color: '#111' }}>Ch 2 (Right)</option>
          </select>
        </label>

        <label>
          <div>Method</div>
          <select value={method} onChange={e => setMethod(e.target.value as Method)}>
            {METHOD_OPTIONS.map(v => (
              <option key={v} value={v} style={{ color: '#111' }}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div>Win</div>
          <select value={win} onChange={e => setWin(parseInt(e.target.value, 10))}>
            {WIN_OPTIONS.map(v => (
              <option key={v} value={v} style={{ color: '#111' }}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div>Hop</div>
          <select value={hop} onChange={e => setHop(parseInt(e.target.value, 10))}>
            {HOP_OPTIONS.map(v => (
              <option key={v} value={v} style={{ color: '#111' }}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 8, opacity: 0.8 }}>
        SR: {ctxRef.current?.sampleRate ?? '—'} • Method: {method} • Win: {win} • Hop: {Math.min(hop, win)}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {!running ? <button onClick={start}>Start</button> : <button onClick={stop}>Stop</button>}
        <span>{status}</span>
      </div>

      <div style={{ fontSize: 28, fontWeight: 600 }}>
        {freq > 0 ? `${freq.toFixed(1)} Hz` : '—'}
      </div>
    </div>
  );
}
