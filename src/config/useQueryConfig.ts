import type { MutationMeta, QueryMeta } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { BootstrapConfig, TanstackQueryConfig } from '../types';

export const useQueryConfig = (): TanstackQueryConfig => {
  const queryClient = useQueryClient();

  const setConfig = (options: BootstrapConfig) => {
    let mutationMeta: MutationMeta | undefined = queryClient.getMutationDefaults()?.meta ?? {};
    let queryMeta: QueryMeta | undefined = queryClient.getQueryDefaults()?.meta ?? {};

    const { pauseFutureMutations, pauseFutureQueries, mutationMiddleware, queryMiddleware, ...otherOptions } = options;

    if (pauseFutureMutations) {
      mutationMeta.pauseFutureMutations = pauseFutureMutations;
    }

    if (mutationMiddleware) {
      mutationMeta.mutationMiddleware = mutationMiddleware;
    }

    mutationMeta = { meta: { ...mutationMeta, ...otherOptions } };

    if (pauseFutureQueries) {
      queryMeta.pauseFutureQueries = pauseFutureQueries;
    }

    if (queryMiddleware) {
      queryMeta.mutationMiddleware = queryMiddleware;
    }

    queryMeta = { meta: { ...queryMeta, ...otherOptions } };

    const defaultMutationOptions = queryClient.defaultMutationOptions();
    const defaultQueryOptions = queryClient.defaultQueryOptions();

    queryClient.setDefaultOptions({
      queries: { ...defaultQueryOptions, meta: queryMeta },
      mutations: { ...defaultMutationOptions, meta: mutationMeta },
    });
  };

  const mutationMeta = (queryClient.getDefaultOptions().mutations?.meta ?? {}) as unknown as BootstrapConfig;
  const queryMeta = (queryClient.getDefaultOptions().queries?.meta ?? {}) as unknown as BootstrapConfig;

  const options: BootstrapConfig = { ...queryMeta, ...mutationMeta };
  return { options, setConfig };
};
