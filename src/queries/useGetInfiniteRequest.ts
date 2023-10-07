import type { InfiniteData, UseQueryOptions } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useEnvironmentVariables, useQueryHeaders } from '../config';

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
  const [requestPath, updatePath] = useState<string>(path);

  const [options, setOptions] = useState<any>(queryOptions);

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
    pageParam?: string
  ) => {
    if (load) {
      // get request headers
      const globalHeaders: RawAxiosRequestHeaders = getHeaders();

      const getResponse = await makeRequest<TResponse>({
        path: pageParam ?? requestPath,
        headers: { ...globalHeaders, ...headers },
        baseURL: baseUrl ?? API_URL,
        timeout: TIMEOUT,
      });

      if (getResponse.status) {
        res(getResponse as IRequestSuccess<TResponse & { pagination: Pagination }>);
      } else {
        rej(getResponse);
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
    ({ pageParam = requestPath }) =>
      new Promise<IRequestSuccess<TResponse & { pagination: Pagination }> | IRequestError>((res, rej) =>
        sendRequest(res, rej, pageParam)
      ),
    {
      enabled: load,
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
    await setOptionsAsync(fetchOptions);
    await updatedPathAsync(link);

    return query.data;
  };

  const updatedPathAsync = async (link: string) => {
    startTransition(() => {
      updatePath(link);
    });
  };

  useEffect(() => {
    if (keyTracker) {
      // set expiration time for the tracker
      queryClient.setQueryDefaults([keyTracker], {
        cacheTime: Infinity,
        staleTime: Infinity,
      });

      queryClient.setQueryData([keyTracker], [requestPath, {}]);
    }
  }, [keyTracker, requestPath, queryClient, queryOptions?.staleTime]);

  return {
    get,
    ...query,
  };
};
