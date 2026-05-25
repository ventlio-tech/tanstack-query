import type { DataSourceMode, LocalMutationHandler } from './datasource-store';
import { useDataSourceStore } from './datasource-store';

export function setDataSourceMode(mode: DataSourceMode): void {
  useDataSourceStore.getState().setMode(mode);
}

export function registerLocalMutation(key: string, handler: LocalMutationHandler): void {
  useDataSourceStore.getState().setLocalMutation(key, handler);
}
