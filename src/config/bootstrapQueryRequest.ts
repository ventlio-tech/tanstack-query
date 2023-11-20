import type { QueryClient } from '@tanstack/react-query';
import 'url-search-params-polyfill';
import type { BootstrapConfig } from '../types';

export const bootstrapQueryRequest = (queryClient: QueryClient, options?: BootstrapConfig): void => {
  // make query config doesn't expire

  // set default query config
  const defaultMeta = {
    headers: {
      Authorization: ``,
    },
    options,
  };

  queryClient.setDefaultOptions({
    queries: {
      meta: defaultMeta,
    },
    mutations: { meta: defaultMeta },
  });
};
