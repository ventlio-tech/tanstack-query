import { useQueryClient } from '@tanstack/react-query';

export const useKeyTrackerModel = <T>(keyTracker: string) => {
  const queryClient = useQueryClient();

  const getQueryKey = (innerKeyTracker?: string) => {
    const key: any[] | undefined = queryClient.getQueryData([
      innerKeyTracker ?? keyTracker,
    ]);

    return key;
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
