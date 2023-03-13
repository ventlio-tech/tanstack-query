import { useQueryClient } from '@tanstack/react-query';
import type { IUseQueryBaseURL, TanstackQueryConfig } from '../types';
import { useQueryConfig } from './useQueryConfig';

export const useQueryBaseURL = (): IUseQueryBaseURL => {
  const { baseURL } = useQueryConfig();
  const queryClient = useQueryClient();

  const setQueryBaseUrl = (newBaseUrl: TanstackQueryConfig['baseURL']) => {
    queryClient.setQueryData<TanstackQueryConfig>(['config'], (config) => {
      (config as TanstackQueryConfig).baseURL = newBaseUrl;
      return config;
    });
  };

  return { baseURL, setQueryBaseUrl };
};
