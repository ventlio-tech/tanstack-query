import type { QueryClient } from '@tanstack/react-query';
import type { BootstrapQueryRequest, TanstackQueryConfig } from '../types';

export const bootstrapQueryRequest = (queryClient: QueryClient, options?: BootstrapQueryRequest): void => {
  // make query config doesn't expire
  queryClient.setQueryDefaults(['config'], {
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  // set default query confg
  queryClient.setQueryData<TanstackQueryConfig>(['config'], {
    headers: {
      Authorization: ``,
    },
    options,
  });
};
