import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useEnvironmentVariables, useQueryHeaders } from '../config';
import { scrollToTop } from '../helpers';
import { HttpMethod, makeRequest } from '../request';

import type { RawAxiosRequestHeaders } from 'axios';
import type {
  IRequestError,
  IRequestSuccess,
} from '../request/request.interface';

export const usePatchRequest = <TResponse>({ path }: { path: string }) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();

  const { getHeaders } = useQueryHeaders();

  // register post mutation
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>(
    (postData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        return (async () => {
          // get request headers
          const headers: RawAxiosRequestHeaders = getHeaders();

          makeRequest<TResponse>({
            path: path,
            body: postData,
            method: HttpMethod.PATCH,
            headers,
            baseURL: API_URL,
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
        })();
      })
  );

  const patch = async (
    postData: any,
    options?:
      | MutateOptions<IRequestSuccess<TResponse>, IRequestError, void, unknown>
      | undefined
  ): Promise<IRequestSuccess<TResponse>> => {
    return mutation.mutateAsync(postData, options);
  };

  return { patch, ...mutation };
};
