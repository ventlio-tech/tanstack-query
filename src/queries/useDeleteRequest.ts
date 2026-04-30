import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useEffect, useMemo, useState } from 'react';
import { useEnvironmentVariables } from '../config';
import { bootStore } from '../config/bootStore';
import { usePowerSyncStore } from '../powersync/powersync-store';
import type { IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';
import { useHeaderStore, usePauseFutureRequests } from '../stores';
import type { DefaultRequestOptions } from './queries.interface';

export const useDeleteRequest = <TResponse>(deleteOptions?: DefaultRequestOptions) => {
  const { baseUrl, headers } = deleteOptions ?? {};

  const { headerProvider } = useStore(bootStore);
  const [requestPayload, setRequestPayload] = useState<{ path: string; options?: any }>();

  const isFutureMutationsPaused = usePauseFutureRequests((state) => state.isFutureMutationsPaused);

  const { API_URL, TIMEOUT } = useEnvironmentVariables();

  // PowerSync mutation resolution — uses an empty path since delete paths are dynamic
  const psStore = usePowerSyncStore();
  const isPowerSyncMode = psStore.mode === 'powersync' && psStore.config !== null;

  const storeHeaders = useHeaderStore((state) => state.headers);

  // Get headers from both the store and the headerProvider (if configured)
  const globalHeaders = useMemo(() => {
    const providerHeaders = headerProvider ? headerProvider() : undefined;
    return { ...providerHeaders, ...storeHeaders };
  }, [storeHeaders, headerProvider]);

  const sendRequest = async (path: string): Promise<IRequestSuccess<TResponse>> => {
    const requestOptions = {
      path,
      headers: { ...globalHeaders, ...headers },
      baseURL: baseUrl ?? API_URL,
      method: HttpMethod.DELETE,
      timeout: TIMEOUT,
    };

    const deleteResponse = await makeRequest<TResponse>(requestOptions);

    if (deleteResponse.status) {
      return deleteResponse as IRequestSuccess<TResponse>;
    } else {
      throw deleteResponse;
    }
  };

  // Use mutation instead of query for DELETE operations
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError, { path: string }>({
    mutationFn: async ({ path }) => sendRequest(path),
  });

  /**
   * Perform a DELETE request to the specified path
   * @param path - The API path to send the DELETE request to
   * @param options - Optional mutation options (onSuccess, onError, etc.)
   */
  const destroy = async (
    path: string,
    options?: MutateOptions<IRequestSuccess<TResponse>, IRequestError, { path: string }, unknown>
  ): Promise<IRequestSuccess<TResponse> | undefined> => {
    if (!isFutureMutationsPaused) {
      return mutation.mutateAsync({ path }, options);
    } else {
      setRequestPayload({ path, options });
      return undefined;
    }
  };

  // Resume paused requests when mutations are unpaused
  useEffect(() => {
    if (!isFutureMutationsPaused && requestPayload) {
      destroy(requestPayload.path, requestPayload.options);
      setRequestPayload(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFutureMutationsPaused]);

  if (isPowerSyncMode) {
    const psDestroy = async (deletePath: string): Promise<IRequestSuccess<TResponse> | undefined> => {
      const mapping = psStore.config?.collections.resolve(deletePath);
      if (!mapping) return undefined;
      const { usePowerSyncMutation: _ } = await import('../powersync/usePowerSyncMutation');
      const { parseApiPath } = await import('../powersync/powersync-resolver');
      const { filters } = parseApiPath(deletePath);
      const id = filters.id;
      if (!id) throw new Error('Delete requires an ID in the path');

      const collection = mapping.collection as any;
      if (collection && typeof collection.delete === 'function') {
        await collection.delete({ id });
      }

      return {
        status: true,
        statusCode: 200,
        message: 'Deleted from local database',
        timeStamp: new Date(),
        data: { id } as TResponse,
      };
    };

    return {
      destroy: psDestroy,
      ...mutation,
      isLoading: false,
      isInitialLoading: false,
      isFetching: false,
    };
  }

  return {
    destroy,
    ...mutation,
    isLoading: mutation.isPending || isFutureMutationsPaused,
    isInitialLoading: false,
    //@deprecated
    isFetching: mutation.isPending,
  };
};
