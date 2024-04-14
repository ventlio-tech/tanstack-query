import { useQueryClient } from '@tanstack/react-query';

export const useKeyTrackerModel = (keyTracker: string) => {
  const queryClient = useQueryClient();

  const getQueryKey = (innerKeyTracker?: string) => {
    const queryKey: any[] | undefined = queryClient.getQueryData([innerKeyTracker ?? keyTracker]);

    return queryKey;
  };

  const refetchQuery = async (innerKeyTracker?: string) => {
    const queryKey: any = getQueryKey(innerKeyTracker ?? keyTracker);

    await queryClient.refetchQueries({
      queryKey,
      exact: true,
    });
  };

  return { refetchQuery, getQueryKey };
};
