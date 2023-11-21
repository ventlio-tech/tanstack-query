import type { InfiniteData, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useEnvironmentVariables, useQueryConfig, useQueryHeaders } from '../config';

import type { IRequestError, IRequestSuccess } from '../request';
import { makeRequest } from '../request';
import type { DefaultRequestOptions, TanstackInfiniteQueryOption } from './queries.interface';

interface Pagination {
  previous_page: number;
  current_page: number;
  next_page: number;
  size: number;
  page_count: number;
  total: number;
}

export const useGetInfiniteRequest = <TResponse extends Record<string, any>>({
  path,
  load = false,
  queryOptions,
  keyTracker,
  baseUrl,
  headers,
}: {
  path: string;
  load?: boolean;
  queryOptions?: TanstackInfiniteQueryOption<TResponse & { pagination: Pagination }>;
  keyTracker?: string;
} & DefaultRequestOptions) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { getHeaders } = useQueryHeaders();
  const [requestPath, setRequestPath] = useState<string>(path);
  const [queryConfig, setQueryConfig] = useState<{ link: string; fetchOptions: any }>();

  const [options, setOptions] = useState<any>(queryOptions);
  const { options: queryConfigOptions, setConfig } = useQueryConfig();

  let queryClient = useQueryClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  queryClient = useMemo(() => queryClient, []);

  const sendRequest = async (
    res: (
      value:
        | IRequestError
        | IRequestSuccess<TResponse & { pagination: Pagination }>
        | PromiseLike<IRequestError | IRequestSuccess<TResponse & { pagination: Pagination }>>
    ) => void,
    rej: (reason?: any) => void,
    queryKey: QueryKey,
    pageParam?: string
  ) => {
    if (load) {
      // get request headers
      const globalHeaders = getHeaders();

      const requestOptions = {
        path: pageParam ?? requestPath,
        headers: { ...globalHeaders, ...headers },
        baseURL: baseUrl ?? API_URL,
        timeout: TIMEOUT,
      };

      let shouldContinue = true;

      if (queryConfigOptions.queryMiddleware) {
        shouldContinue = await queryConfigOptions.queryMiddleware({ queryKey, ...requestOptions });
      }

      if (shouldContinue) {
        const getResponse = await makeRequest<TResponse>(requestOptions);

        if (getResponse.status) {
          res(getResponse as IRequestSuccess<TResponse & { pagination: Pagination }>);
        } else {
          rej(getResponse);
        }
      } else {
        rej(null);
      }
    } else {
      res(null as any);
    }
  };

  /**
   *
   * This pagination implementation is currently tied to our use case
   */
  const constructPaginationLink = (
    direction: 'next_page' | 'previous_page',
    lastPage: IRequestSuccess<
      TResponse & {
        pagination: Pagination;
      }
    >
  ) => {
    const [pathname, queryString] = requestPath.split('?');

    const queryParams = new URLSearchParams(queryString);
    const lastPageItem = lastPage.data.pagination[direction];

    queryParams.set('page', String(lastPageItem));

    return pathname + '?' + queryParams.toString();
  };

  const query = useInfiniteQuery<any, any, IRequestSuccess<TResponse & { pagination: Pagination }>>(
    [requestPath, {}],
    ({ pageParam = requestPath, queryKey }) =>
      new Promise<IRequestSuccess<TResponse & { pagination: Pagination }> | IRequestError>((res, rej) =>
        sendRequest(res, rej, queryKey, pageParam)
      ),
    {
      enabled: load || !queryConfigOptions.pauseFutureQueries,
      getNextPageParam: (lastPage) => constructPaginationLink('next_page', lastPage),
      getPreviousPageParam: (lastPage) => constructPaginationLink('previous_page', lastPage),
      ...options,
    }
  );

  const setOptionsAsync = async (fetchOptions: any) => {
    startTransition(() => {
      setOptions(fetchOptions);
    });
  };

  const get = async (
    link: string,
    fetchOptions?: UseQueryOptions<
      IRequestSuccess<TResponse | undefined>,
      IRequestError,
      IRequestSuccess<TResponse | undefined>,
      Array<any>
    >
  ): Promise<
    | InfiniteData<
        IRequestSuccess<
          TResponse & {
            pagination: Pagination;
          }
        >
      >
    | undefined
  > => {
    if (!queryConfigOptions.pauseFutureQueries) {
      await setOptionsAsync(fetchOptions);
      await updatedPathAsync(link);

      return query.data;
    } else {
      setQueryConfig({ link, fetchOptions });

      return undefined;
    }
  };

  const updatedPathAsync = async (link: string) => {
    startTransition(() => {
      setRequestPath(link);
    });
  };

  useEffect(() => {
    if (keyTracker) {
      setConfig({ [keyTracker]: [requestPath, {}] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyTracker, requestPath]);

  useEffect(() => {
    if (!queryConfigOptions.pauseFutureQueries && queryConfig) {
      get(queryConfig.link, queryConfig.fetchOptions);
      setQueryConfig(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryConfigOptions.pauseFutureQueries]);

  return {
    get,
    ...query,
    isLoading: query.isLoading || queryConfigOptions.pauseFutureQueries,
  };
};
