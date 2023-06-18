import type { QueryClient } from '@tanstack/react-query';
import type { BootstrapConfig, TanstackQueryConfig } from '../types';

export const bootstrapQueryRequest = (queryClient: QueryClient, options?: BootstrapConfig): void => {
  // make query config doesn't expire
  queryClient.setQueryDefaults(['config'], {
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  // set default query config
  queryClient.setQueryData<TanstackQueryConfig>(['config'], {
    headers: {
      Authorization: ``,
    },
    options,
  });
};
