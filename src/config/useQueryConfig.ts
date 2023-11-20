import { useQueryClient } from '@tanstack/react-query';
import type { TanstackQueryConfig } from '../types';

export const useQueryConfig = (): TanstackQueryConfig => {
  const queryClient = useQueryClient();

  const mutationMeta = (queryClient.getDefaultOptions().mutations?.meta ?? {}) as unknown as TanstackQueryConfig;
  const queryMeta = (queryClient.getDefaultOptions().queries?.meta ?? {}) as unknown as TanstackQueryConfig;

  return { ...queryMeta, ...mutationMeta };
};
