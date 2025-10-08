import { create } from 'zustand';

export const useBaseUrlStore = create<{
  baseUrl?: string;
  setBaseUrl: (baseUrl?: string) => void;
}>((set) => ({
  baseUrl: undefined,
  setBaseUrl: (baseUrl) => set({ baseUrl }),
}));
