// Allow TS to know about the worklet globals without installing extra types.
declare const sampleRate: number;

interface PitchMessage {
  type: 'ready' | 'error' | 'pitch' | 'params-applied';
  error?: string;
  hz?: number;
  method?: string;
  bufSize?: number;
  hopSize?: number;
}
