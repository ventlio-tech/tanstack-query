import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition, useEffect, useMemo, useState } from 'react';
import type { RawAxiosRequestHeaders } from '../../node_modules/axios/index';
import { useEnvironmentVariables, useQueryHeaders } from '../config';

import type { IRequestError, IRequestSuccess } from '../request';
import { makeRequest } from '../request';
import type { DefaultRequestOptions, IPagination, TanstackQueryOption } from './queries.interface';

export const useGetRequest = <TResponse extends Record<string, any>>({
  path,
  load = false,
  queryOptions,
  keyTracker,
  baseUrl,
  headers,
}: {
  path: string;
  load?: boolean;
  queryOptions?: TanstackQueryOption<TResponse>;
  keyTracker?: string;
} & DefaultRequestOptions) => {
  const [requestPath, updatePath] = useState<string>(path);
  const [options, setOptions] = useState<any>(queryOptions);
  const [page, setPage] = useState<number>(1);

  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { getHeaders } = useQueryHeaders();

  let queryClient = useQueryClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  queryClient = useMemo(() => queryClient, []);

  const sendRequest = async (
    res: (
      value: IRequestError | IRequestSuccess<TResponse> | PromiseLike<IRequestError | IRequestSuccess<TResponse>>
    ) => void,
    rej: (reason?: any) => void
  ) => {
    if (load) {
      // get request headers
      const globalHeaders: RawAxiosRequestHeaders = getHeaders();

      const getResponse = await makeRequest<TResponse>({
        path: requestPath,
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
      res(null as any) ;
    }
  };

  const query = useQuery<any, any, IRequestSuccess<TResponse>>(
    [requestPath, {}],
    () => new Promise<IRequestSuccess<TResponse> | IRequestError >((res, rej) => sendRequest(res, rej)),
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
      // set expiration time for the tracker
      queryClient.setQueryDefaults([keyTracker], {
        cacheTime: Infinity,
        staleTime: Infinity,
      });

      queryClient.setQueryData([keyTracker], [requestPath, {}]);
    }
  }, [keyTracker, requestPath, queryClient, queryOptions?.staleTime]);

  const nextPage = () => {
    if (query.data?.data.pagination) {
      const pagination: IPagination = query.data.data.pagination;
      if (pagination.next_page !== pagination.current_page && pagination.next_page > pagination.current_page) {
        updatePath(constructPaginationLink(requestPath, pagination.next_page));
      }
    }
  };

  const prevPage = () => {
    if (query.data?.data.pagination) {
      const pagination: IPagination = query.data.data.pagination;
      if (pagination.previous_page !== pagination.current_page && pagination.previous_page < pagination.current_page) {
        updatePath(constructPaginationLink(requestPath, pagination.previous_page));
      }
    }
  };

  const constructPaginationLink = (link: string, pageNumber: number) => {
    const [pathname, queryString] = link.split('?');
    const queryParams = new URLSearchParams(queryString);

    const oldPage = Number(queryParams.get('page'));

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
