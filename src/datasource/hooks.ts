import { useCallback, useRef } from 'react';
import type { DataSourceMode, LocalMutationHandler } from './datasource-store';
import { useDataSourceStore } from './datasource-store';

export function useDataMode(): DataSourceMode {
  return useDataSourceStore((s) => s.mode);
}

const EMPTY_ARRAY: unknown[] = [];

export function useLocalTableData<T = unknown>(tableName: string): T[] {
  const tableNameRef = useRef(tableName);
  tableNameRef.current = tableName;

  const selector = useCallback(
    (s: { localData: Map<string, { data: unknown[] }> }) => s.localData.get(tableNameRef.current)?.data ?? EMPTY_ARRAY,
    []
  );

  return useDataSourceStore(selector) as T[];
}

export function getLocalTableData<T = unknown>(tableName: string): T[] {
  return (useDataSourceStore.getState().localData.get(tableName)?.data ?? EMPTY_ARRAY) as T[];
}

export function useLocalMutation(key: string): LocalMutationHandler | undefined {
  return useDataSourceStore((s) => s.localMutations.get(key));
}
