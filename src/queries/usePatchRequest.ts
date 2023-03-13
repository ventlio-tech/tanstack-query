import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { scrollToTop } from '../helpers';
import { HttpMethod, makeRequest } from '../request';

import { useQueryConfig } from '../config';
import type {
  IRequestError,
  IRequestSuccess,
} from '../request/request.interface';

export const usePatchRequest = <TResponse>({ path }: { path: string }) => {
  const { headers, baseURL, timeout } = useQueryConfig();

  // register post mutation
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>(
    (postData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        makeRequest<TResponse>({
          path: path,
          body: postData,
          method: HttpMethod.PATCH,
          headers,
          baseURL,
          timeout,
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
