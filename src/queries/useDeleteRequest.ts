import type { MutateOptions, QueryObserverResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';

export const useDeleteRequest = <TResponse>() => {
  const [requestPath, updateDeletePath] = useState<string>('');
  const [options, setOptions] = useState<any>();
  const authToken = '';
  const query = useQuery<any, any, IRequestSuccess<TResponse>>(
    [requestPath, {}],
    () =>
      new Promise<IRequestSuccess<TResponse> | IRequestError>((res, rej) => {
        setTimeout(async () => {
          const postResponse = await makeRequest<TResponse>({
            path: requestPath,
            bearerToken: authToken,
            method: HttpMethod.DELETE,
          });
          if (postResponse.status) {
            res(postResponse as IRequestSuccess<TResponse>);
          } else {
            rej(postResponse);
          }
        }, 200);
      }),
    { ...options }
  );

  const updatedPathAsync = async (link: string) => {
    return updateDeletePath(link);
  };

  const setOptionsAsync = async (fetchOptions: any) => {
    return setOptions(fetchOptions);
  };
  const deleteR = async (
    link: string,
    fetchOptions?:
      | MutateOptions<IRequestSuccess<TResponse>, IRequestError, void, unknown>
      | undefined
  ): Promise<QueryObserverResult<IRequestSuccess<TResponse>, any>> => {
    await updatedPathAsync(link);
    await setOptionsAsync(fetchOptions);

    return query.refetch<TResponse>({
      queryKey: [link, {}],
    });
  };
  return { updateDeletePath, deleteR, ...query };
};
