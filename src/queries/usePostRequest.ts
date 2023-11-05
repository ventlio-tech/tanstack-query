import type { MutateOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEnvironmentVariables, useQueryHeaders, useReactNativeEnv } from '../config';

import type { RawAxiosRequestHeaders } from 'axios';
import { scrollToTop } from '../helpers';
import { useUploadProgress } from '../hooks';
import type { IMakeRequest, IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';
import type { TanstackQueryConfig } from '../types';
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
  const queryClient = useQueryClient();
  const { getHeaders } = useQueryHeaders();
  const { isApp } = useReactNativeEnv();
  const { uploadProgressPercent, onUploadProgress } = useUploadProgress();

  const sendRequest = async (
    res: (value: any) => void,
    rej: (reason?: any) => void,
    postData: { data: any; requestConfig?: IMakeRequest }
  ) => {
    // get request headers
    const globalHeaders: RawAxiosRequestHeaders = getHeaders();
    const config = queryClient.getQueryData<TanstackQueryConfig>(['config']);
    const { data, requestConfig } = postData;

    delete requestConfig?.body;

    const postResponse = await makeRequest<TResponse>({
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
    });

    if (postResponse.status) {
      // scroll to top after success

      if (config?.options?.context !== 'app') {
        scrollToTop();
      }
      res(postResponse as IRequestSuccess<TResponse>);
    } else {
      // scroll to top after error
      if (config?.options?.context !== 'app') {
        scrollToTop();
      }
      rej(postResponse);
    }
  };

  // register post mutation
  const mutation = useMutation<
    IRequestSuccess<TResponse>,
    IRequestError,
    { data: any; requestConfig?: Omit<IMakeRequest, 'body'> }
  >(async (postData) => new Promise<IRequestSuccess<TResponse>>((res, rej) => sendRequest(res, rej, postData)));

  const post = async <T>(
    data?: T,
    options?:
      | MutateOptions<
          IRequestSuccess<TResponse>,
          IRequestError,
          { data: T; requestConfig?: Omit<IMakeRequest, 'body'> },
          unknown
        >
      | undefined,
    requestConfig?: Omit<IMakeRequest, 'body'>
  ): Promise<IRequestSuccess<TResponse>> => {
    return mutation.mutateAsync({ data, requestConfig }, options);
  };

  return { post, uploadProgressPercent, ...mutation };
};
