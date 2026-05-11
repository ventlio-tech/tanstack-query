import { useQueryClient } from '@tanstack/react-query';
import { useDataSourceStore } from '../datasource/datasource-store';

export const useRefetchQuery = async (queryKey: any[]) => {
  const queryClient = useQueryClient();
  const dataSourceMode = useDataSourceStore.getState().mode;

  const refetchQuery = async <T>(innerQueryKey?: any[]) => {
    if (dataSourceMode === 'local') return undefined;

    await queryClient.invalidateQueries(
      {
        queryKey: innerQueryKey ?? queryKey,
        exact: true,
      },
      { throwOnError: true, cancelRefetch: true }
    );

    return queryClient.getQueriesData<T>({ queryKey: innerQueryKey ?? queryKey });
  };

  return { refetchQuery };
};
