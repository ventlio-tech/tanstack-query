import { create } from 'zustand';
import type { DataSourceMode, PowerSyncConfig } from './powersync.interface';

export interface PowerSyncStore {
  mode: DataSourceMode;
  config: PowerSyncConfig | null;
  setConfig: (config: PowerSyncConfig) => void;
  setMode: (mode: DataSourceMode) => void;
}

export const usePowerSyncStore = create<PowerSyncStore>((set) => ({
  mode: 'api',
  config: null,
  setConfig: (config) => set({ config, mode: config.mode }),
  setMode: (mode) => set({ mode }),
}));
