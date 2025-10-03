// public/aubio-pitch-worklet.js
import aubio from '/vendor/aubio.esm.js';

class AubioPitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.method  = 'yinfft';
    this.bufSize = 4096;
    this.hopSize = 1024;

    this.Pitch    = null;
    this.detector = null;
    this.ready    = false;

    this._ring = new Float32Array(this.hopSize);
    this._pos  = 0;

    this._init();

    this.port.onmessage = (e) => {
      const m = e.data || {};
      if (m.type === 'setParams') {
        if (typeof m.method  === 'string') this.method  = m.method;
        if (typeof m.bufSize === 'number') this.bufSize = m.bufSize|0;
        if (typeof m.hopSize === 'number') this.hopSize = m.hopSize|0;

        if (!this._ring || this._ring.length !== this.hopSize) {
          this._ring = new Float32Array(this.hopSize);
          this._pos  = 0;
        }
        this._makeDetector();
        this.port.postMessage({
          type: 'params-applied',
          method:this.method, bufSize:this.bufSize, hopSize:this.hopSize
        });
      }
    };
  }

  async _init() {
    try {
      const { Pitch } = await aubio();
      this.Pitch = Pitch;
      this._makeDetector();
      this.ready = true;
      this.port.postMessage({ type: 'ready' });
    } catch (e) {
      this.port.postMessage({ type: 'error', error: String(e) });
    }
  }

  _makeDetector() {
    if (!this.Pitch) return;
    this.detector = new this.Pitch(this.method, this.bufSize, this.hopSize, sampleRate);
  }

  process(inputs) {
    if (!this.ready || !this.detector) return true;
    const ch = inputs[0]?.[0];
    if (!ch) return true;

    let i = 0;
    while (i < ch.length) {
      const n = Math.min(this.hopSize - this._pos, ch.length - i);
      this._ring.set(ch.subarray(i, i + n), this._pos);
      this._pos += n; i += n;

      if (this._pos >= this.hopSize) {
        const hz = this.detector.do(this._ring) || 0;
        this.port.postMessage({ type: 'pitch', hz: (hz > 0 && isFinite(hz)) ? hz : 0 });
        this._pos = 0;
      }
    }
    return true;
  }
}

registerProcessor('aubio-pitch', AubioPitchProcessor);
