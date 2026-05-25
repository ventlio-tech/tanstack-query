import { useQueryClient } from '@tanstack/react-query';
import { useDataSourceStore } from '../datasource/datasource-store';

export const useKeyTrackerModel = (keyTracker: string) => {
  const queryClient = useQueryClient();
  const dataSourceMode = useDataSourceStore((s) => s.mode);

  const getQueryKey = (innerKeyTracker?: string) => {
    const queryKey: any[] | undefined = queryClient.getQueryData([innerKeyTracker ?? keyTracker]);

    return queryKey;
  };

  const refetchQuery = async (innerKeyTracker?: string) => {
    if (dataSourceMode === 'local') return;

    const queryKey: any = getQueryKey(innerKeyTracker ?? keyTracker);

    await queryClient.refetchQueries({
      queryKey,
      exact: true,
    });
  };

  return { refetchQuery, getQueryKey };
};
