'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { audioEngine } from '@/lib/audio/engine';

type AudioState = {
  /** Off by default. Nothing ever plays until the user turns this on. */
  enabled: boolean;
  supported: boolean;
  setEnabled: (on: boolean) => void;
  toggle: () => void;
  /** Bumped by the hero "Hear it" CTA; the demo section starts when it changes. */
  demoRequest: number;
  requestDemo: () => void;
};

const AudioCtx = createContext<AudioState | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [demoRequest, setDemoRequest] = useState(0);
  // Assume support during SSR, confirm on the client (avoids hydration mismatch).
  const [supported, setSupported] = useState(true);
  useEffect(() => setSupported(audioEngine.supported), []);

  // Called from click handlers so the AudioContext is created inside a gesture.
  const setEnabled = useCallback((on: boolean) => {
    if (on) audioEngine.unlock();
    else audioEngine.mute();
    setEnabledState(on);
  }, []);

  const toggle = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const requestDemo = useCallback(() => {
    setEnabled(true);
    setDemoRequest((n) => n + 1);
  }, [setEnabled]);

  const value = useMemo(
    () => ({ enabled, supported, setEnabled, toggle, demoRequest, requestDemo }),
    [enabled, supported, setEnabled, toggle, demoRequest, requestDemo],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
  return ctx;
}
