import { useQueryClient } from '@tanstack/react-query';
import type { IUseQueryTimeout, TanstackQueryConfig } from '../types';
import { useQueryConfig } from './useQueryConfig';

export const useQueryTimeout = (): IUseQueryTimeout => {
  const { timeout } = useQueryConfig();
  const queryClient = useQueryClient();

  const setQueryTimeout = (newTimeout: TanstackQueryConfig['timeout']) => {
    queryClient.setQueryData<TanstackQueryConfig>(['config'], (config): any => {
      const newConfig = { ...config, timeout: newTimeout };

      return newConfig;
    });
  };

  return { timeout, setQueryTimeout };
};
