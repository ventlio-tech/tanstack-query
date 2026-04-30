import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useEffect, useMemo, useState } from 'react';
import { useEnvironmentVariables } from '../config';
import { bootStore } from '../config/bootStore';
import { useUploadProgress } from '../hooks';
import { usePowerSyncMutation } from '../powersync/usePowerSyncMutation';
import { usePowerSyncStore } from '../powersync/powersync-store';
import { HttpMethod, makeRequest } from '../request';
import type { IRequestError, IRequestSuccess } from '../request/request.interface';
import { useHeaderStore, usePauseFutureRequests } from '../stores';
import type { DefaultRequestOptions } from './queries.interface';

export const usePatchRequest = <TResponse>({ path, baseUrl, headers }: { path: string } & DefaultRequestOptions) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { uploadProgressPercent, onUploadProgress } = useUploadProgress();
  const { headerProvider } = useStore(bootStore);

  // PowerSync mutation resolution
  const psStore = usePowerSyncStore();
  const psMapping = useMemo(() => {
    if (psStore.mode !== 'powersync' || !psStore.config) return null;
    return psStore.config.collections.resolve(path);
  }, [psStore.mode, psStore.config, path]);

  const isPowerSyncActive = psStore.mode === 'powersync' && psMapping !== null;

  const psMutation = usePowerSyncMutation<TResponse>({
    mapping: psMapping,
    path,
    operation: 'update',
  });

  const storeHeaders = useHeaderStore((state) => state.headers);

  // Get headers from both the store and the headerProvider (if configured)
  const globalHeaders = useMemo(() => {
    const providerHeaders = headerProvider ? headerProvider() : undefined;
    return { ...providerHeaders, ...storeHeaders };
  }, [storeHeaders, headerProvider]);

  const [requestPayload, setRequestPayload] = useState<Record<any, any>>();

  const isFutureMutationsPaused = usePauseFutureRequests((state) => state.isFutureMutationsPaused);

  const sendRequest = async (res: (value: any) => void, rej: (reason?: any) => void, data: any) => {
    // get request headers

    const requestOptions = {
      path: path,
      body: data,
      method: HttpMethod.PATCH,
      headers: { ...globalHeaders, ...headers },
      baseURL: baseUrl ?? API_URL,
      timeout: TIMEOUT,
      onUploadProgress,
    };

    // let patchResponse: IRequestError | IRequestSuccess<TResponse>;
    // if (middleware) {
    //   // perform global middleware
    //   const middlewareResponse = await middleware(
    //     async (options) =>
    //       await makeRequest<TResponse>(
    //         options ? { ...requestOptions, ...options } : requestOptions
    //       ),
    //     {
    //       path,
    //       baseUrl: baseUrl ?? API_URL,
    //       body: data,
    //     }
    //   );

    //   patchResponse = middlewareResponse;
    // } else {
    const patchResponse = await makeRequest<TResponse>(requestOptions);
    // }
    if (patchResponse.status) {
      res(patchResponse as IRequestSuccess<TResponse>);
    } else {
      rej(patchResponse);
    }
  };

  // register post mutation
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>({
    mutationKey: [path, { type: 'mutation' }],
    mutationFn: (dataData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        return sendRequest(res, rej, dataData);
      }),
  });

  const patch = async (
    data: any,
    options?: MutateOptions<IRequestSuccess<TResponse>, IRequestError, void, unknown> | undefined
  ): Promise<IRequestSuccess<TResponse> | undefined> => {
    if (!isFutureMutationsPaused) {
      return mutation.mutateAsync(data, options);
    } else {
      setRequestPayload({ data, options });
      return undefined;
    }
  };

  useEffect(() => {
    if (!isFutureMutationsPaused && requestPayload) {
      patch(requestPayload.data, requestPayload.options);
      setRequestPayload(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFutureMutationsPaused]);

  if (isPowerSyncActive) {
    const psPatch = async (data?: any): Promise<IRequestSuccess<TResponse> | undefined> => {
      return psMutation.mutate(data);
    };
    return {
      patch: psPatch,
      uploadProgressPercent: 0,
      ...psMutation,
      isLoading: psMutation.isLoading,
    };
  }

  return { patch, uploadProgressPercent, ...mutation, isLoading: mutation.isPending || isFutureMutationsPaused };
};
