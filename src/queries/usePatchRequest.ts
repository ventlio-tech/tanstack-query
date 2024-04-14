import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useEnvironmentVariables, useQueryConfig } from '../config';
import { scrollToTop } from '../helpers';
import { useUploadProgress } from '../hooks';
import { HttpMethod, makeRequest } from '../request';
import type { IRequestError, IRequestSuccess } from '../request/request.interface';
import { useHeaderStore, usePauseFutureRequests } from '../stores';
import type { DefaultRequestOptions } from './queries.interface';

export const usePatchRequest = <TResponse>({ path, baseUrl, headers }: { path: string } & DefaultRequestOptions) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { uploadProgressPercent, onUploadProgress } = useUploadProgress();
  const globalHeaders = useHeaderStore((state) => state.headers);

  const [requestPayload, setRequestPayload] = useState<Record<any, any>>();

  const isFutureMutationsPaused = usePauseFutureRequests((state) => state.isFutureMutationsPaused);

  const config = useQueryConfig();

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

    let shouldContinue = true;

    if (config.options?.mutationMiddleware) {
      shouldContinue = await config.options.mutationMiddleware({
        mutationKey: [path, { type: 'mutation' }],
        ...requestOptions,
      });
    }

    if (shouldContinue) {
      const patchResponse = await makeRequest<TResponse>(requestOptions);
      if (patchResponse.status) {
        // scroll to top after success
        if (config.options?.context !== 'app') {
          scrollToTop();
        }
        res(patchResponse as IRequestSuccess<TResponse>);
      } else {
        // scroll to top after error
        if (config.options?.context !== 'app') {
          scrollToTop();
        }
        rej(patchResponse);
      }
    } else {
      rej(null);
    }
  };

  // register post mutation
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>({
    mutationFn: (dataData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        return sendRequest(res, rej, dataData);
      }),
    mutationKey: [path, { type: 'mutation' }],
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

  return { patch, uploadProgressPercent, ...mutation, isLoading: mutation.isPending || isFutureMutationsPaused };
};
