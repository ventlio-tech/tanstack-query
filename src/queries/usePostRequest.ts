import type { MutateOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEnvironmentVariables, useQueryHeaders } from '../config';

import type { RawAxiosRequestHeaders } from 'axios';
import { scrollToTop } from '../helpers';
import type { IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';
import type { TanstackQueryConfig } from '../types';
import type { DefaultRequestOptions } from './queries.interface';

export const usePostRequest = <TResponse>({
  path,
  isFormData = false,
  baseUrl,
  headers,
}: {
  path: string;
  isFormData?: boolean;
} & DefaultRequestOptions) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const queryClient = useQueryClient();
  const { getHeaders } = useQueryHeaders();

  const sendRequest = async (res: (value: any) => void, rej: (reason?: any) => void, postData: any) => {
    // get request headers
    const globalHeaders: RawAxiosRequestHeaders = getHeaders();
    const config = queryClient.getQueryData<TanstackQueryConfig>(['config']);

    const postResponse = await makeRequest<TResponse>({
      path,
      body: postData,
      method: HttpMethod.POST,
      isFormData,
      headers: { ...globalHeaders, ...headers },
      baseURL: baseUrl ?? API_URL,
      timeout: TIMEOUT,
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
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>(
    async (postData: any) => new Promise<IRequestSuccess<TResponse>>((res, rej) => sendRequest(res, rej, postData))
  );
  const post = async (
    data: any,
    options?: MutateOptions<IRequestSuccess<TResponse>, IRequestError, void, unknown> | undefined
  ): Promise<IRequestSuccess<TResponse>> => {
    return mutation.mutateAsync(data, options);
  };

  return { post, ...mutation };
};
