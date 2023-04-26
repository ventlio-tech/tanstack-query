import { useQueryClient } from '@tanstack/react-query';
import type { IUseQueryHeaders, TanstackQueryConfig } from '../types';
import { useQueryConfig } from './useQueryConfig';

export const useQueryHeaders = (): IUseQueryHeaders => {
  const { headers } = useQueryConfig();
  const queryClient = useQueryClient();

  const setQueryHeaders = (newHeaders: TanstackQueryConfig['headers']) => {
    queryClient.setQueryData<TanstackQueryConfig>(['config'], (config): any => {
      const newConfig = { ...config, headers: newHeaders };
      return newConfig;
    });
  };

  return { headers, setQueryHeaders };
};
