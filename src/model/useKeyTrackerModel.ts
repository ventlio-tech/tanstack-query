import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export const useKeyTrackerModel = <T>(keyTracker: string) => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<T>();
  const [queryKey, setQueryKey] = useState<any[] | undefined>();

  const getQueryKey = (innerKeyTracker?: string) => {
    const key: any[] | undefined = queryClient.getQueryData([
      innerKeyTracker ?? keyTracker,
    ]);
    setQueryKey(key);
    return key;
  };

  const refetchQuery = (innerKeyTracker?: string) => {
    const key: any = getQueryKey(innerKeyTracker ?? keyTracker);

    const queryData = queryClient.getQueryData<T>(key);

    setData(queryData);

    return queryData;
  };

  return { refetchQuery, getQueryKey, queryKey, data };
};
