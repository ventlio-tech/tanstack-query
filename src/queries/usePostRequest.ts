import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useEnvironmentVariables, useQueryConfig, useQueryHeaders, useReactNativeEnv } from '../config';

import { useEffect, useState } from 'react';
import { scrollToTop } from '../helpers';
import { useUploadProgress } from '../hooks';
import type { IMakeRequest, IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';
import type { DefaultRequestOptions } from './queries.interface';

export const usePostRequest = <TResponse>({
  path,
  isFormData = false,
  baseUrl,
  headers,
  fileSelectors,
}: {
  path: string;
  isFormData?: boolean;
  fileSelectors?: string[];
} & DefaultRequestOptions) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();

  const config = useQueryConfig();
  const [mutationConfig, setMutationConfig] = useState<{ data: any; options: any }>();

  const { getHeaders } = useQueryHeaders();
  const { isApp } = useReactNativeEnv();
  const { uploadProgressPercent, onUploadProgress } = useUploadProgress();

  const sendRequest = async (
    res: (value: any) => void,
    rej: (reason?: any) => void,
    postData: { data: any; requestConfig?: Partial<IMakeRequest> }
  ) => {
    // get request headers
    const globalHeaders = getHeaders();

    const { data, requestConfig } = postData;

    delete requestConfig?.body;

    const requestOptions = {
      path,
      body: data,
      method: HttpMethod.POST,
      isFormData,
      headers: { ...globalHeaders, ...headers },
      baseURL: baseUrl ?? API_URL,
      timeout: TIMEOUT,
      appFileConfig: {
        isApp,
        fileSelectors,
      },
      onUploadProgress,
      ...requestConfig,
    };

    let shouldContinue = true;

    if (config.options.mutationMiddleware) {
      shouldContinue = await config.options.mutationMiddleware({
        mutationKey: [path, { type: 'mutation' }],
        ...requestOptions,
      });
    }

    if (shouldContinue) {
      const postResponse = await makeRequest<TResponse>(requestOptions);

      if (postResponse.status) {
        // scroll to top after success

        if (config.options.context !== 'app') {
          scrollToTop();
        }
        res(postResponse as IRequestSuccess<TResponse>);
      } else {
        // scroll to top after error
        if (config.options.context !== 'app') {
          scrollToTop();
        }
        rej(postResponse);
      }
    } else {
      rej(null);
    }
  };

  // register post mutation
  const mutation = useMutation<
    IRequestSuccess<TResponse>,
    IRequestError,
    { data: any; requestConfig?: Partial<Omit<IMakeRequest, 'body'>> }
  >(async (postData) => new Promise<IRequestSuccess<TResponse>>((res, rej) => sendRequest(res, rej, postData)), {
    mutationKey: [path, { type: 'mutation' }],
  });

  const post = async <T>(
    data?: T,
    options?: (
      | MutateOptions<
          IRequestSuccess<TResponse>,
          IRequestError,
          { data: T; requestConfig?: Partial<Omit<IMakeRequest, 'body'>> },
          unknown
        >
      | { requestConfig?: Partial<Omit<IMakeRequest, 'body'>> }
      | undefined
    ) & { requestConfig?: Partial<Omit<IMakeRequest, 'body'>> }
  ): Promise<IRequestSuccess<TResponse> | undefined> => {
    if (!config.options.pauseFutureMutations) {
      const { requestConfig, ...otherOptions } = options ?? {};
      return mutation.mutateAsync({ data, requestConfig }, otherOptions);
    } else {
      setMutationConfig({ data, options });
      return undefined;
    }
  };

  useEffect(() => {
    if (!config.options.pauseFutureMutations && mutationConfig) {
      post(mutationConfig.data, mutationConfig.options);
      setMutationConfig(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.options.pauseFutureMutations]);

  return { post, uploadProgressPercent, ...mutation };
};
