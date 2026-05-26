import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEnvironmentVariables } from '../config';

import { useStore } from '@tanstack/react-store';
import { bootStore } from '../config/bootStore';
import { useDataSourceStore } from '../datasource/datasource-store';
import { IRequestError, IRequestSuccess, makeRequest } from '../request';
import { executeMiddlewareChain } from '../request/make-request';
import { useHeaderStore, usePauseFutureRequests } from '../stores';
import type { MiddlewareContext, MiddlewareNext } from '../types';
import { DefaultRequestOptions, IPagination, TanstackQueryOption } from './queries.interface';

/**
 * Hook for making GET requests with pagination support.
 * When DataSource mode is 'local', HTTP fetching is disabled so the
 * desktop data layer can provide data through the DataSource store.
 */
export const useGetRequest = <TResponse extends Record<string, any>>({
  path,
  load = false,
  queryOptions,
  keyTracker,
  baseUrl,
  headers,
  paginationConfig,
}: {
  path: string;
  load?: boolean;
  queryOptions?: TanstackQueryOption<TResponse>;
  keyTracker?: string;
  paginationConfig?: {
    extractPagination?: (response: IRequestSuccess<TResponse>) => IPagination | undefined;
    buildPaginationUrl?: (url: string, page: number) => string;
    pageParamName?: string;
  };
} & DefaultRequestOptions) => {
  const [requestPath, setRequestPath] = useState<string>(path);
  const [page, setPage] = useState<number>(1);

  const isIntentionalPathChangeRef = useRef(false);

  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { middleware, pagination: globalPaginationConfig, headerProvider } = useStore(bootStore);

  const dataSourceMode = useDataSourceStore((s) => s.mode);
  const isLocalMode = dataSourceMode === 'local';

  const storeHeaders = useHeaderStore((state) => state.headers);

  const globalHeaders = useMemo(() => {
    const providerHeaders = headerProvider ? headerProvider() : undefined;
    return { ...providerHeaders, ...storeHeaders };
  }, [storeHeaders, headerProvider]);

  const isFutureQueriesPaused = usePauseFutureRequests((state) => state.isFutureQueriesPaused);

  const queryClient = useQueryClient();

  const pagination = useMemo(
    () => ({
      ...globalPaginationConfig,
      ...paginationConfig,
    }),
    [globalPaginationConfig, paginationConfig]
  );

  const executeRequest = useCallback(
    async (requestUrl: string): Promise<IRequestSuccess<TResponse>> => {
      const requestOptions = {
        path: requestUrl,
        headers: { ...globalHeaders, ...headers },
        baseURL: baseUrl ?? API_URL,
        timeout: TIMEOUT,
      };

      const finalHandler: MiddlewareNext<TResponse> = async (options) => {
        const finalOptions = options ? { ...requestOptions, ...options } : requestOptions;
        return await makeRequest<TResponse>(finalOptions);
      };

      let getResponse: IRequestError | IRequestSuccess<TResponse>;

      if (middleware && Array.isArray(middleware) && middleware.length > 0) {
        const context: MiddlewareContext<TResponse> = {
          baseUrl: baseUrl ?? API_URL,
          path: requestUrl,
          options: requestOptions,
        };

        getResponse = await executeMiddlewareChain<TResponse>(middleware, context, finalHandler);
      } else {
        getResponse = await makeRequest<TResponse>(requestOptions);
      }

      if (getResponse.status) {
        return getResponse as IRequestSuccess<TResponse>;
      } else {
        throw getResponse;
      }
    },
    [globalHeaders, headers, baseUrl, API_URL, TIMEOUT, middleware]
  );

  const query = useQuery({
    queryKey: [requestPath, {}] as const,
    queryFn: async ({ queryKey }) => {
      const [url] = queryKey;
      return executeRequest(url);
    },
    enabled: load === true && !isFutureQueriesPaused && !isLocalMode,
    ...queryOptions,
  });

  useEffect(() => {
    if (isIntentionalPathChangeRef.current) {
      isIntentionalPathChangeRef.current = false;
      return;
    }

    if (path && path !== requestPath) {
      setRequestPath(path);
    }
  }, [path, requestPath]);

  useEffect(() => {
    if (keyTracker) {
      queryClient.setQueryDefaults([keyTracker], {
        staleTime: Infinity,
      });
      queryClient.setQueryData([keyTracker], [requestPath, {}]);
    }
  }, [keyTracker, requestPath, queryClient, queryOptions?.staleTime]);

  const getPaginationData = useCallback(
    (response: IRequestSuccess<TResponse>): IPagination | undefined => {
      const extractPagination =
        pagination.extractPagination ||
        ((res) => {
          if ('pagination' in res.data) {
            return res.data.pagination as IPagination;
          }
          return undefined;
        });

      return extractPagination(response);
    },
    [pagination.extractPagination]
  );

  const constructPaginationLink = useCallback(
    (link: string, pageNumber: number) => {
      const buildPaginationUrl =
        pagination.buildPaginationUrl ||
        ((url, targetPage) => {
          const [pathname, queryString] = url.split('?');
          const queryParams = new URLSearchParams(queryString || '');
          const pageParamName = pagination.pageParamName || 'page';

          queryParams.set(pageParamName, String(targetPage));
          return pathname + '?' + queryParams.toString();
        });

      return buildPaginationUrl(link, pageNumber);
    },
    [pagination.buildPaginationUrl, pagination.pageParamName]
  );

  const nextPage = useCallback(() => {
    const data = query.data as IRequestSuccess<TResponse> | undefined;
    if (!data) return;

    const paginationData = getPaginationData(data);
    if (!paginationData) return;

    if (
      paginationData.next_page !== paginationData.current_page &&
      paginationData.next_page > paginationData.current_page
    ) {
      const newPath = constructPaginationLink(requestPath, paginationData.next_page);
      setRequestPath(newPath);
      setPage(paginationData.next_page);
    }
  }, [query.data, getPaginationData, constructPaginationLink, requestPath]);

  const prevPage = useCallback(() => {
    const data = query.data as IRequestSuccess<TResponse> | undefined;
    if (!data) return;

    const paginationData = getPaginationData(data);
    if (!paginationData) return;

    if (
      paginationData.previous_page !== paginationData.current_page &&
      paginationData.previous_page < paginationData.current_page
    ) {
      const newPath = constructPaginationLink(requestPath, paginationData.previous_page);
      setRequestPath(newPath);
      setPage(paginationData.previous_page);
    }
  }, [query.data, getPaginationData, constructPaginationLink, requestPath]);

  const gotoPage = useCallback(
    (pageNumber: number) => {
      const newPath = constructPaginationLink(requestPath, pageNumber);
      setRequestPath(newPath);
      setPage(pageNumber);
    },
    [constructPaginationLink, requestPath]
  );

  const get = useCallback(
    async (
      url: string,
      fetchOptions?: {
        staleTime?: number;
        gcTime?: number;
        updateSubscription?: boolean;
      }
    ): Promise<IRequestSuccess<TResponse>> => {
      if (isLocalMode) {
        return {} as IRequestSuccess<TResponse>;
      }

      if (isFutureQueriesPaused) {
        throw new Error('Queries are currently paused');
      }

      const { staleTime, gcTime, updateSubscription = true } = fetchOptions ?? {};

      if (updateSubscription) {
        isIntentionalPathChangeRef.current = true;
        setRequestPath(url);
      }

      const result = await queryClient.fetchQuery({
        queryKey: [url, {}] as const,
        queryFn: () => executeRequest(url),
        staleTime,
        gcTime,
      });

      return result;
    },
    [queryClient, executeRequest, isFutureQueriesPaused, setRequestPath, isLocalMode]
  );

  const queryRef = useRef(query);
  queryRef.current = query;

  const refetch = useCallback(() => {
    return queryRef.current.refetch();
  }, []);

  return {
    ...query,
    isLoading: query.isLoading || isFutureQueriesPaused,
    setRequestPath,
    nextPage,
    prevPage,
    get,
    gotoPage,
    page,
    refetch,
    queryKey: [requestPath, {}] as const,
    getPaginationData: () => {
      const data = query.data as IRequestSuccess<TResponse> | undefined;
      return data ? getPaginationData(data) : undefined;
    },
  };
};
