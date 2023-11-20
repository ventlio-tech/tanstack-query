import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useEnvironmentVariables, useQueryConfig, useQueryHeaders, useReactNativeEnv } from '../config';

import type { RawAxiosRequestHeaders } from 'axios';
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

  const { getHeaders } = useQueryHeaders();
  const { isApp } = useReactNativeEnv();
  const { uploadProgressPercent, onUploadProgress } = useUploadProgress();

  const sendRequest = async (
    res: (value: any) => void,
    rej: (reason?: any) => void,
    postData: { data: any; requestConfig?: Partial<IMakeRequest> }
  ) => {
    // get request headers
    const globalHeaders: RawAxiosRequestHeaders = getHeaders();

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

      if (config.options?.context !== 'app') {
        scrollToTop();
      }
      res(postResponse as IRequestSuccess<TResponse>);
    } else {
      // scroll to top after error
      if (config.options?.context !== 'app') {
        scrollToTop();
      }
      rej(postResponse);
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
  ): Promise<IRequestSuccess<TResponse>> => {
    const { requestConfig, ...otherOptions } = options ?? {};
    return mutation.mutateAsync({ data, requestConfig }, otherOptions);
  };

  return { post, uploadProgressPercent, ...mutation };
};
