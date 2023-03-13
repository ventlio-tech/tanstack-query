import { useQueryClient } from '@tanstack/react-query';
import type { IUseQueryHeaders, TanstackQueryConfig } from '../types';
import { useQueryConfig } from './useQueryConfig';

export const useQueryHeaders = (): IUseQueryHeaders => {
  const { headers } = useQueryConfig();
  const queryClient = useQueryClient();

  const setQueryHeaders = (newHeaders: TanstackQueryConfig['headers']) => {
    queryClient.setQueryData<TanstackQueryConfig>(['config'], (config) => {
      (config as TanstackQueryConfig).headers = newHeaders;
      return config;
    });
  };

  return { headers, setQueryHeaders };
};
