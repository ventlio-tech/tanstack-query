import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';

export const usePostRequest = <TResponse>({
  path,
  formData = false,
}: {
  path: string;
  formData?: boolean;
}) => {
  const authToken = '';

  const [resetForm, setResetForm] = useState<boolean>(false);

  // register post mutation
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>(
    async (postData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        setResetForm(false);
        makeRequest<TResponse>({
          path: path,
          body: postData,
          method: HttpMethod.POST,
          bearerToken: authToken,
          formData,
        }).then((postResponse) => {
          if (postResponse.status) {
            setResetForm(true);
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

  return { post, ...mutation, resetForm };
};
