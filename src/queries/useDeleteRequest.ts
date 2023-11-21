import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useEnvironmentVariables, useQueryConfig, useQueryHeaders } from '../config';
import type { IRequestError, IRequestSuccess } from '../request';
import { makeRequest } from '../request';
import type { DefaultRequestOptions } from './queries.interface';

export const useDeleteRequest = <TResponse>(deleteOptions?: DefaultRequestOptions) => {
  const { baseUrl, headers } = deleteOptions ?? {};
  const [requestPath, setRequestPath] = useState<string>('');
  const [options, setOptions] = useState<any>();
  const [destroyConfig, setDestroyConfig] = useState<{ link: string; internalDeleteOptions: any }>();

  const { options: queryConfigOptions } = useQueryConfig();

  const { API_URL, TIMEOUT } = useEnvironmentVariables();

  const { getHeaders } = useQueryHeaders();

  const sendRequest = async (res: (value: any) => void, rej: (reason?: any) => void, queryKey: QueryKey) => {
    // get request headers
    const globalHeaders = getHeaders();

    const [url] = queryKey;
    const requestUrl = (url ?? requestPath) as string;

    const requestOptions = {
      path: requestUrl,
      headers: { ...globalHeaders, ...headers },
      baseURL: baseUrl ?? API_URL,
      timeout: TIMEOUT,
    };

    let shouldContinue = true;

    if (queryConfigOptions.queryMiddleware) {
      shouldContinue = await queryConfigOptions.queryMiddleware({ queryKey, ...requestOptions });
    }

    if (shouldContinue) {
      const postResponse = await makeRequest<TResponse>(requestOptions);

      if (postResponse.status) {
        res(postResponse as IRequestSuccess<TResponse>);
      } else {
        rej(postResponse);
      }
    } else {
      rej(null);
    }
  };

  const query = useQuery<any, any, IRequestSuccess<TResponse>>(
    [requestPath, {}],
    ({ queryKey }) =>
      new Promise<IRequestSuccess<TResponse> | IRequestError>((res, rej) => sendRequest(res, rej, queryKey)),
    { enabled: false, ...options }
  );

  const updatedPathAsync = async (link: string) => {
    return setRequestPath(link);
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
    if (!queryConfigOptions.pauseFutureQueries) {
      // set enabled to be true for every delete
      internalDeleteOptions = internalDeleteOptions ?? {};
      internalDeleteOptions.enabled = true;

      await setOptionsAsync(internalDeleteOptions);
      await updatedPathAsync(link);

      return query.data;
    } else {
      // save delete config
      setDestroyConfig({ link, internalDeleteOptions });
      return undefined;
    }
  };

  useEffect(() => {
    if (!queryConfigOptions.pauseFutureQueries && destroyConfig) {
      destroy(destroyConfig.link, destroyConfig.internalDeleteOptions);
      setDestroyConfig(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryConfigOptions.pauseFutureQueries]);

  return { destroy, ...query, isLoading: query.isLoading || queryConfigOptions.pauseFutureQueries };
};
