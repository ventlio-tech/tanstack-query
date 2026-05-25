import { create } from 'zustand';

export type DataSourceMode = 'api' | 'local';

export type LocalMutationHandler = (...args: any[]) => Promise<any>;

interface LocalTableEntry {
  data: unknown[];
  updatedAt: number;
}

export interface DataSourceStore {
  mode: DataSourceMode;
  localData: Map<string, LocalTableEntry>;
  localMutations: Map<string, LocalMutationHandler>;
  setMode: (mode: DataSourceMode) => void;
  setTableData: (tableName: string, data: unknown[]) => void;
  getTableData: (tableName: string) => unknown[] | undefined;
  setLocalMutation: (key: string, handler: LocalMutationHandler) => void;
  getLocalMutation: (key: string) => LocalMutationHandler | undefined;
}

export const useDataSourceStore = create<DataSourceStore>((set, get) => ({
  mode: 'api',
  localData: new Map(),
  localMutations: new Map(),
  setMode: (mode) => set({ mode }),
  setTableData: (tableName, data) =>
    set((state) => {
      const existing = state.localData.get(tableName);
      if (existing && existing.data === data) return state;
      const next = new Map(state.localData);
      next.set(tableName, { data, updatedAt: Date.now() });
      return { localData: next };
    }),
  getTableData: (tableName) => get().localData.get(tableName)?.data,
  setLocalMutation: (key, handler) =>
    set((state) => {
      const next = new Map(state.localMutations);
      next.set(key, handler);
      return { localMutations: next };
    }),
  getLocalMutation: (key) => get().localMutations.get(key),
}));
