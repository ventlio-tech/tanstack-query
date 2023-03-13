import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { startTransition, useEffect, useState } from 'react';
import type { IRequestError, IRequestSuccess } from '../request';
import { makeRequest } from '../request';
import type { IPagination, TanstackQueryOption } from './queries.interface';
import { useQueryConfig } from './useQueryConfig';

export const useGetRequest = <TResponse extends Record<string, any>>({
  path,
  load = false,
  queryOptions,
}: {
  path: string;
  load?: boolean;
  queryOptions?: TanstackQueryOption<TResponse>;
}) => {
  const [requestPath, updatePath] = useState<string>(path);
  const [options, setOptions] = useState<any>(queryOptions);
  const [page, setPage] = useState<number>(1);

  const { headers, baseURL, timeout } = useQueryConfig();

  const sendRequest = async (
    res: (
      value:
        | IRequestError
        | IRequestSuccess<TResponse>
        | PromiseLike<IRequestError | IRequestSuccess<TResponse>>
    ) => void,
    rej: (reason?: any) => void
  ) => {
    const postResponse = await makeRequest<TResponse>({
      path: requestPath,
      headers,
      baseURL,
      timeout,
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
