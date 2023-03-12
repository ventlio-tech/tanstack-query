import type { MutateOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { scrollToTop } from '../helpers';
import { HttpMethod, makeRequest } from '../request';

import type {
  IRequestError,
  IRequestSuccess,
} from '../request/request.interface';

export const usePatchRequest = <TResponse>({
  path,
  isFormData = false,
}: {
  path: string;
  isFormData?: boolean;
}) => {
  const authToken = '';
  const [resetForm, setResetForm] = useState<boolean>(false);

  // register post mutation
  const mutation = useMutation<IRequestSuccess<TResponse>, IRequestError>(
    (postData: any) =>
      new Promise<IRequestSuccess<TResponse>>((res, rej) => {
        setResetForm(false);

        makeRequest<TResponse>({
          path: path,
          body: postData,
          method: HttpMethod.PATCH,
          bearerToken: authToken,
          isFormData,
        }).then((postResponse) => {
          if (postResponse.status) {
            setResetForm(true);
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

  return { patch, ...mutation, resetForm };
};
