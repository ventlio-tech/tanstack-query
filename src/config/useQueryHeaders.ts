import { useQueryClient } from '@tanstack/react-query';
import type { IUseQueryHeaders, TanstackQueryConfig } from '../types';
import { useQueryConfig } from './useQueryConfig';

export const useQueryHeaders = (): IUseQueryHeaders => {
  const queryClient = useQueryClient();
  const { headers, options } = useQueryConfig();

  const getHeaders = (): TanstackQueryConfig['headers'] => {
    return headers;
  };

  const setQueryHeaders = (newHeaders: TanstackQueryConfig['headers']) => {
    const defaultMeta = {
      headers: { ...headers, ...newHeaders },
      options,
    };

    queryClient.setDefaultOptions({
      queries: {
        meta: defaultMeta,
      },
      mutations: { meta: defaultMeta },
    });
  };

  return { setQueryHeaders, getHeaders };
};
