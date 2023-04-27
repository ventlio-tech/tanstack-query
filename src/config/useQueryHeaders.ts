import { useQueryClient } from '@tanstack/react-query';
import type { IUseQueryHeaders, TanstackQueryConfig } from '../types';

export const useQueryHeaders = (): IUseQueryHeaders => {
  const queryClient = useQueryClient();

  const getHeadersAsync = async (): Promise<TanstackQueryConfig> => {
    return queryClient.ensureQueryData({
      queryKey: ['config'],
      queryFn: () => {
        return queryClient.getQueryData(['config']);
      },
    });
  };

  const setQueryHeaders = (newHeaders: TanstackQueryConfig['headers']) => {
    queryClient.setQueryData<TanstackQueryConfig>(['config'], (config): any => {
      const newConfig = { ...config, headers: newHeaders };
      return newConfig;
    });
  };

  return { setQueryHeaders, getHeadersAsync };
};
