import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
import { useEnvironmentVariables, useQueryHeaders } from '../config';
import { scrollToTop } from '../helpers';
import { HttpMethod, makeRequest } from '../request';
import type { IRequestError, IRequestSuccess } from '../request/request.interface';
import type { DefaultRequestOptions } from './queries.interface';

export const usePatchRequest = <TResponse>({ path, baseUrl, headers }: { path: string } & DefaultRequestOptions) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();

  const { getHeaders } = useQueryHeaders();

  const sendRequest = async (res: (value: any) => void, rej: (reason?: any) => void, data: any) => {
    // get request headers
    const globalHeaders: RawAxiosRequestHeaders = getHeaders();

    makeRequest<TResponse>({
      path: path,
      body: data,
      method: HttpMethod.PATCH,
      headers: { ...globalHeaders, ...headers },
      baseURL: baseUrl ?? API_URL,
      timeout: TIMEOUT,
    }).then((postResponse) => {
      if (postResponse.status) {
        // scroll to top after success
        scrollToTop();
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
    (dataData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        return sendRequest(res, rej, dataData);
      })
  );

  const patch = async (
    data: any,
    options?: MutateOptions<IRequestSuccess<TResponse>, IRequestError, void, unknown> | undefined
  ): Promise<IRequestSuccess<TResponse>> => {
    return mutation.mutateAsync(data, options);
  };

  return { patch, ...mutation };
};
