'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Method = 'yin' | 'yinfft' | 'mcomb' | 'fcomb' | 'schmitt';

type MediaDev = { deviceId: string; label: string };

type SettingsState = {
  method: Method;
  setMethod: (m: Method) => void;
  win: number;
  setWin: (v: number) => void;
  hop: number;
  setHop: (v: number) => void;
  devices: MediaDev[];
  deviceId: string;
  setDeviceId: (id: string) => void;
  channelIndex: number;
  setChannelIndex: (i: number) => void;
};

const defaultState = {
  method: 'yinfft' as Method,
  setMethod: (_: Method) => {},
  win: 4096,
  setWin: (_: number) => {},
  hop: 1024,
  setHop: (_: number) => {},
  devices: [] as MediaDev[],
  deviceId: '',
  setDeviceId: (_: string) => {},
  channelIndex: 0,
  setChannelIndex: (_: number) => {},
};

const SettingsContext = createContext<SettingsState>(defaultState);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [method, setMethod] = useState<Method>(defaultState.method);
  const [win, setWin] = useState<number>(defaultState.win);
  const [hop, setHop] = useState<number>(defaultState.hop);
  const [devices, setDevices] = useState<MediaDev[]>(defaultState.devices);
  const [deviceId, setDeviceId] = useState<string>(defaultState.deviceId);
  const [channelIndex, setChannelIndexRaw] = useState<number>(0);
  const setChannelIndex = (i: number) => {
    console.log('SettingsContext: setChannelIndex called with', i);
    setChannelIndexRaw(i);
  };

  useEffect(() => {
    (async () => {
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const inputs = all
          .filter(d => d.kind === 'audioinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || 'Audio input' }));
        setDevices(inputs);
        if (!deviceId && inputs.length) {
          const ext = inputs.find(d => /focusrite|scarlett|behringer|steinberg|m-?audio|usb|interface/i.test(d.label));
          setDeviceId((ext ?? inputs[0]).deviceId);
        }
      } catch (e) {
        console.warn('enumerateDevices failed', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SettingsContext.Provider value={{
      method, setMethod, win, setWin, hop, setHop,
      devices, deviceId, setDeviceId, channelIndex, setChannelIndex
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
