import { useQueryClient } from '@tanstack/react-query';
import type { TanstackQueryConfig } from '../types';

export const useQueryConfig = (): TanstackQueryConfig => {
  const queryClient = useQueryClient();

  const {
    headers = {},
    baseURL = '',
    timeout = 10000,
  } = queryClient.getQueryData<TanstackQueryConfig>([
    'config',
  ]) as TanstackQueryConfig;

  return { headers, baseURL, timeout };
};
