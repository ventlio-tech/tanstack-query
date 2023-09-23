import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
import { useState } from 'react';
import { useEnvironmentVariables, useQueryHeaders } from '../config';
import type { IRequestError, IRequestSuccess } from '../request';
import { HttpMethod, makeRequest } from '../request';
import type { DefaultRequestOptions } from './queries.interface';

export const useDeleteRequest = <TResponse>(deleteOptions?: DefaultRequestOptions) => {
  const { baseUrl, headers } = deleteOptions ?? {};
  const [requestPath, updateDeletePath] = useState<string>('');
  const [options, setOptions] = useState<any>();

  const { API_URL, TIMEOUT } = useEnvironmentVariables();

  const { getHeaders } = useQueryHeaders();

  const sendRequest = async (res: (value: any) => void, rej: (reason?: any) => void) => {
    // get request headers
    const globalHeaders: RawAxiosRequestHeaders = getHeaders();

    const postResponse = await makeRequest<TResponse>({
      path: requestPath,
      headers: { ...globalHeaders, ...headers },
      method: HttpMethod.DELETE,
      baseURL: baseUrl ?? API_URL,
      timeout: TIMEOUT,
    });

    if (postResponse.status) {
      res(postResponse as IRequestSuccess<TResponse>);
    } else {
      rej(postResponse);
    }
  };

  const query = useQuery<any, any, IRequestSuccess<TResponse>>(
    [requestPath, {}],
    () => new Promise<IRequestSuccess<TResponse> | IRequestError>((res, rej) => sendRequest(res, rej)),
    { enabled: false, ...options }
  );

  const updatedPathAsync = async (link: string) => {
    return updateDeletePath(link);
  };

  const setOptionsAsync = async (fetchOptions: any) => {
    return setOptions(fetchOptions);
  };

  const destroy = async (
    link: string,
    internalDeleteOptions?: UseQueryOptions<
      IRequestSuccess<TResponse | undefined>,
      IRequestError,
      IRequestSuccess<TResponse | undefined>,
      Array<any>
    > & { cached?: boolean }
  ): Promise<IRequestSuccess<TResponse> | undefined> => {
    // set enabled to be true for every delete
    internalDeleteOptions = internalDeleteOptions ?? {};
    internalDeleteOptions.enabled = true;

    await setOptionsAsync(internalDeleteOptions);
    await updatedPathAsync(link);

    return query.data;
  };

  return { destroy, ...query };
};
