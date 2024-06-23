import { useQueryClient } from '@tanstack/react-query';

export const useRefetchQuery = async (queryKey: any[]) => {
  const queryClient = useQueryClient();

  const refetchQuery = async <T>(innerQueryKey?: any[]) => {
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
