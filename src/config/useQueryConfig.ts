import { useQueryClient } from '@tanstack/react-query';
import type { TanstackQueryConfig } from '../types';

export const useQueryConfig = (): TanstackQueryConfig => {
  const queryClient = useQueryClient();

  const { headers = {} } =
    queryClient.getQueryData<TanstackQueryConfig>(['config']) ?? {};

  return { headers };
};
