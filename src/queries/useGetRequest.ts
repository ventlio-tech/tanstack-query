import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useEnvironmentVariables, useQueryHeaders } from '../config';

import type { IRequestError, IRequestSuccess } from '../request';
import { makeRequest } from '../request';
import type { IPagination, TanstackQueryOption } from './queries.interface';

export const useGetRequest = <TResponse extends Record<string, any>>({
  path,
  load = false,
  queryOptions,
  keyTracker,
}: {
  path: string;
  load?: boolean;
  queryOptions?: TanstackQueryOption<TResponse>;
  keyTracker?: string;
}) => {
  const [requestPath, updatePath] = useState<string>(path);
  const [options, setOptions] = useState<any>(queryOptions);
  const [page, setPage] = useState<number>(1);

  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { getHeadersAsync } = useQueryHeaders();

  let queryClient = useQueryClient();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  queryClient = useMemo(() => queryClient, []);

  const sendRequest = async (
    res: (
      value:
        | IRequestError
        | IRequestSuccess<TResponse>
        | PromiseLike<IRequestError | IRequestSuccess<TResponse>>
    ) => void,
    rej: (reason?: any) => void
  ) => {
    // get request headers
    const headers: RawAxiosRequestHeaders = await getHeadersAsync();

    const postResponse = await makeRequest<TResponse>({
      path: requestPath,
      headers,
      baseURL: API_URL,
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
    () =>
      new Promise<IRequestSuccess<TResponse> | IRequestError>((res, rej) => {
        return sendRequest(res, rej);
      }),
    {
      enabled: load,
      ...options,
    }
  );

  useEffect(() => {
    if (path) {
      updatePath(path);
    }
  }, [path]);

  useEffect(() => {
    if (keyTracker) {
      queryClient.setQueryData([keyTracker], [requestPath, {}]);
    }
  }, [keyTracker, requestPath, queryClient]);

  const nextPage = () => {
    if (query.data?.data.pagination) {
      const pagination: IPagination = query.data.data.pagination;
      if (
        pagination.next_page !== pagination.current_page &&
        pagination.next_page > pagination.current_page
      ) {
        updatePath(constructPaginationLink(requestPath, pagination.next_page));
      }
    }
  };

  const prevPage = () => {
    if (query.data?.data.pagination) {
      const pagination: IPagination = query.data.data.pagination;
      if (
        pagination.previous_page !== pagination.current_page &&
        pagination.previous_page < pagination.current_page
      ) {
        updatePath(
          constructPaginationLink(requestPath, pagination.previous_page)
        );
      }
    }
  };

  const constructPaginationLink = (link: string, pageNumber: number) => {
    const oldParams = new URLSearchParams(link);
    const oldPage = Number(oldParams.get('page'));

    const [pathname, queryStrings] = link.split('?', 1);
    const queryParams = new URLSearchParams(queryStrings ?? '');

    queryParams.set('page', pageNumber as any);

    link = pathname + '?' + queryParams.toString();

    // only update page when pagination number changed
    if (oldPage !== pageNumber) {
      setPage(pageNumber);
    }
    return link;
  };

  const gotoPage = (pageNumber: number) => {
    updatePath(constructPaginationLink(requestPath, pageNumber));
  };

  const updatedPathAsync = async (link: string) => {
    startTransition(() => {
      updatePath(link);
    });
  };

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
  ): Promise<IRequestSuccess<TResponse> | undefined> => {
    await setOptionsAsync(fetchOptions);
    await updatedPathAsync(link);

    return query.data;
  };

  return {
    ...query,
    updatePath,
    nextPage,
    prevPage,
    get,
    gotoPage,
    page,
    queryKey: [requestPath, {}],
  };
};
