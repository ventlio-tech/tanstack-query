import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useEnvironmentVariables, useQueryHeaders } from '../config';

import type { RawAxiosRequestHeaders } from 'axios';
import type { IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';
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

  const { getHeaders } = useQueryHeaders();

  const sendRequest = async (res: (value: any) => void, rej: (reason?: any) => void, postData: any) => {
    // get request headers
    const globalHeaders: RawAxiosRequestHeaders = getHeaders();

    makeRequest<TResponse>({
      path: path,
      body: postData,
      method: HttpMethod.POST,
      isFormData,
      headers: { ...globalHeaders, ...headers },
      baseURL: baseUrl ?? API_URL,
      timeout: TIMEOUT,
    }).then((postResponse) => {
      if (postResponse.status) {
        // scroll to top after success
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        res(postResponse as IRequestSuccess<TResponse>);
      } else {
        // scroll to top after error
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        rej(postResponse);
      }
    });
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
