import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
import { useEffect, useMemo } from 'react';
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
  queryOptions?: TanstackInfiniteQueryOption<TResponse>;
  keyTracker?: string;
} & DefaultRequestOptions) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { getHeaders } = useQueryHeaders();

  let queryClient = useQueryClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  queryClient = useMemo(() => queryClient, []);

  const sendRequest = async (
    res: (
      value: IRequestError | IRequestSuccess<TResponse> | PromiseLike<IRequestError | IRequestSuccess<TResponse>>
    ) => void,
    rej: (reason?: any) => void,
    pageParam?: string
  ) => {
    if (load) {
      // get request headers
      const globalHeaders: RawAxiosRequestHeaders = getHeaders();

      const getResponse = await makeRequest<TResponse>({
        path: pageParam ?? path,
        headers: { ...globalHeaders, ...headers },
        baseURL: baseUrl ?? API_URL,
        timeout: TIMEOUT,
      });

      if (getResponse.status) {
        res(getResponse as IRequestSuccess<TResponse>);
      } else {
        rej(getResponse);
      }
    } else {
      res(null as any);
    }
  };

  const query = useInfiniteQuery<any, any, IRequestSuccess<TResponse>>(
    [path, {}],
    ({ pageParam = path }) =>
      new Promise<IRequestSuccess<TResponse> | IRequestError>((res, rej) => sendRequest(res, rej, pageParam)),
    {
      enabled: load,
      getNextPageParam: (lastPage, pages) => constructPaginationLink('next_page', lastPage, pages),
      getPreviousPageParam: (lastPage, pages) => constructPaginationLink('previous_page', lastPage, pages),
      ...(queryOptions as any),
    }
  );

  /**
   *
   * This pagination implementation is currently tied to our use case
   */
  const constructPaginationLink = (
    direction: 'next_page' | 'previous_page',
    lastPage: string,
    pages: IRequestSuccess<
      TResponse & {
        pagination: Pagination;
      }
    >[]
  ) => {
    const [pathname, queryString] = lastPage.split('?');

    const queryParams = new URLSearchParams(queryString);
    const lastPageItem = pages[pages.length - 1];

    queryParams.set('page', String(lastPageItem?.data.pagination[direction]));

    return pathname + '?' + queryParams.toString();
  };

  useEffect(() => {
    if (keyTracker) {
      // set expiration time for the tracker
      queryClient.setQueryDefaults([keyTracker], {
        cacheTime: Infinity,
        staleTime: Infinity,
      });

      queryClient.setQueryData([keyTracker], [path, {}]);
    }
  }, [keyTracker, path, queryClient, queryOptions?.staleTime]);

  const flattenedData = query.data?.pages.flat() ?? [];

  return {
    ...query,
    flattenedData,
  };
};
