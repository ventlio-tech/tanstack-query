import { useQueryClient } from '@tanstack/react-query';
import type { IUseQueryHeaders, TanstackQueryConfig } from '../types';

export const useQueryHeaders = (): IUseQueryHeaders => {
  const queryClient = useQueryClient();

  const getHeaders = (): TanstackQueryConfig['headers'] => {
    const config = queryClient.getQueryData(['config']) as TanstackQueryConfig;
    return config.headers;
  };

  const setQueryHeaders = (newHeaders: TanstackQueryConfig['headers']) => {
    // make sure the config does not expire
    queryClient.setDefaultOptions({
      queries: {
        queryKey: ['config'],
        staleTime: Infinity,
        cacheTime: Infinity,
      },
    });

    // set the config
    queryClient.setQueryData<TanstackQueryConfig>(
      ['config'],
      (config): any => {
        const newConfig = { ...config, headers: newHeaders };
        return newConfig;
      },
      {}
    );
  };

  return { setQueryHeaders, getHeaders };
};
