import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useEffect, useMemo, useState } from 'react';
import { useEnvironmentVariables } from '../config';
import { bootStore } from '../config/bootStore';
import { useUploadProgress } from '../hooks';
import { HttpMethod, makeRequest } from '../request';
import { executeMiddlewareChain } from '../request/make-request';
import type { IRequestError, IRequestSuccess } from '../request/request.interface';
import { useHeaderStore, usePauseFutureRequests } from '../stores';
import type { MiddlewareContext, MiddlewareNext } from '../types';
import type { DefaultRequestOptions } from './queries.interface';

export const usePutRequest = <TResponse>({ path, baseUrl, headers }: { path: string } & DefaultRequestOptions) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { uploadProgressPercent, onUploadProgress } = useUploadProgress();
  const { middleware, headerProvider } = useStore(bootStore);

  const storeHeaders = useHeaderStore((state) => state.headers);

  const globalHeaders = useMemo(() => {
    const providerHeaders = headerProvider ? headerProvider() : undefined;
    return { ...providerHeaders, ...storeHeaders };
  }, [storeHeaders, headerProvider]);

  const [requestPayload, setRequestPayload] = useState<Record<any, any>>();

  const isFutureMutationsPaused = usePauseFutureRequests((state) => state.isFutureMutationsPaused);

  const sendRequest = async (res: (value: any) => void, rej: (reason?: any) => void, data: any) => {
    const requestOptions = {
      path: path,
      body: data,
      method: HttpMethod.PUT,
      headers: { ...globalHeaders, ...headers },
      baseURL: baseUrl ?? API_URL,
      timeout: TIMEOUT,
      onUploadProgress,
    };

    const finalHandler: MiddlewareNext<TResponse> = async (options) => {
      const finalOptions = options ? { ...requestOptions, ...options } : requestOptions;
      return await makeRequest<TResponse>(finalOptions);
    };

    let putResponse: IRequestError | IRequestSuccess<TResponse>;

    if (middleware && Array.isArray(middleware) && middleware.length > 0) {
      const context: MiddlewareContext<TResponse> = {
        baseUrl: baseUrl ?? API_URL,
        path,
        body: data,
        method: HttpMethod.PUT,
        headers: requestOptions.headers,
        options: requestOptions,
      };
      putResponse = await executeMiddlewareChain<TResponse>(middleware, context, finalHandler);
    } else {
      putResponse = await makeRequest<TResponse>(requestOptions);
    }

    if (putResponse.status) {
      res(putResponse as IRequestSuccess<TResponse>);
    } else {
      rej(putResponse);
    }
  };

  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>({
    mutationKey: [path, { type: 'mutation' }],
    mutationFn: (dataData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        return sendRequest(res, rej, dataData);
      }),
  });

  const put = async (
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
      put(requestPayload.data, requestPayload.options);
      setRequestPayload(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFutureMutationsPaused]);

  return { put, uploadProgressPercent, ...mutation, isLoading: mutation.isPending || isFutureMutationsPaused };
};
