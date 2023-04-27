import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useEnvironmentVariables, useQueryConfig } from '../config';
import type { IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';

export const usePostRequest = <TResponse>({
  path,
  isFormData = false,
}: {
  path: string;
  isFormData?: boolean;
}) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();

  const { headers } = useQueryConfig();

  // register post mutation
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>(
    async (postData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        makeRequest<TResponse>({
          path: path,
          body: postData,
          method: HttpMethod.POST,
          isFormData,
          headers,
          baseURL: API_URL,
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
      })
  );
  const post = async (
    postData: any,
    options?:
      | MutateOptions<IRequestSuccess<TResponse>, IRequestError, void, unknown>
      | undefined
  ): Promise<IRequestSuccess<TResponse>> => {
    return mutation.mutateAsync(postData, options);
  };

  return { post, ...mutation };
};
