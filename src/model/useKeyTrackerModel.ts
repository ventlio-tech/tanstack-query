import { useQueryClient } from '@tanstack/react-query';

export const useKeyTrackerModel = <T>(keyTracker: string) => {
  const queryClient = useQueryClient();

  const getQueryKey = (innerKeyTracker?: string) => {
    const meta = {
      ...queryClient.getDefaultOptions().mutations?.meta,
      ...queryClient.getDefaultOptions().queries?.meta,
    };
    const queryKey: any[] | undefined = meta[innerKeyTracker ?? keyTracker] as any[];

    return queryKey;
  };

  const refetchQuery = async (innerKeyTracker?: string) => {
    const queryKey: any = getQueryKey(innerKeyTracker ?? keyTracker);

    await queryClient.refetchQueries<T>({
      queryKey,
      exact: true,
    });
  };

  return { refetchQuery, getQueryKey };
};
