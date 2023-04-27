import { useQueryClient } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
import type { IUseQueryHeaders, TanstackQueryConfig } from '../types';

export const useQueryHeaders = (): IUseQueryHeaders => {
  const queryClient = useQueryClient();

  const getHeadersAsync = async (): Promise<RawAxiosRequestHeaders> => {
    return queryClient.ensureQueryData({
      queryKey: ['config'],
      queryFn: () => {
        return (queryClient.getQueryData(['config']) as any)?.headers;
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
