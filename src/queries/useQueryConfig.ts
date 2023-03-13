import { useQueryClient } from '@tanstack/react-query';
import type { TanstackQueryConfig } from '../types';

export const useQueryConfig = (): TanstackQueryConfig => {
  const { getQueryData } = useQueryClient();

  const { headers, baseURL, timeout } = getQueryData<TanstackQueryConfig>([
    'config',
  ]) as TanstackQueryConfig;

  return { headers, baseURL, timeout };
};
