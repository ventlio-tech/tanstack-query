import { useQueryClient } from '@tanstack/react-query';
import type { IUseQueryBaseURL, TanstackQueryConfig } from '../types';
import { useQueryConfig } from './useQueryConfig';

export const useQueryBaseURL = (): IUseQueryBaseURL => {
  const { baseURL } = useQueryConfig();
  const queryClient = useQueryClient();

  const setQueryBaseUrl = (newBaseUrl: TanstackQueryConfig['baseURL']) => {
    queryClient.setQueryData<TanstackQueryConfig>(['config'], (config): any => {
      const newConfig = {
        ...config,
        baseURL: newBaseUrl,
      };

      return newConfig;
    });
  };

  return { baseURL, setQueryBaseUrl };
};
