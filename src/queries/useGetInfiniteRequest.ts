import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEnvironmentVariables } from '../config';

import { useStore } from '@tanstack/react-store';
import { bootStore } from '../config/bootStore';
import { useDataSourceStore } from '../datasource/datasource-store';
import type { IRequestError, IRequestSuccess } from '../request';
import { makeRequest } from '../request';
import { executeMiddlewareChain } from '../request/make-request';
import { useHeaderStore, usePauseFutureRequests } from '../stores';
import type { MiddlewareContext, MiddlewareNext } from '../types';
import type { DefaultRequestOptions, IPagination } from './queries.interface';

interface UseGetInfiniteRequestOptions<TResponse> extends DefaultRequestOptions {
  /** The base API path for the request */
  path: string;
  /** Whether to automatically load data on mount */
  load?: boolean;
  /** Optional key tracker for query key management */
  keyTracker?: string;
  /** Configuration for pagination behavior */
  paginationConfig?: {
    /** Extract pagination data from response */
    extractPagination?: (response: IRequestSuccess<TResponse>) => IPagination | undefined;
    /** Build URL for a specific page */
    buildPageUrl?: (basePath: string, page: number) => string;
    /** Query parameter name for page (default: 'page') */
    pageParamName?: string;
  };
  /** Additional query options */
  queryOptions?: {
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    retry?: number | boolean;
    /** @deprecated Query key is auto-generated from path. This option is ignored. */
    queryKey?: readonly unknown[];
  };
}

/**
 * Hook for making paginated GET requests with infinite scroll support
 * Follows TanStack Query v5 patterns for useInfiniteQuery
 */
export const useGetInfiniteRequest = <TResponse extends Record<string, any>>({
  path,
  load = false,
  keyTracker,
  baseUrl,
  headers,
  paginationConfig,
  queryOptions,
}: UseGetInfiniteRequestOptions<TResponse>) => {
  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { middleware, headerProvider } = useStore(bootStore);
  const storeHeaders = useHeaderStore((state) => state.headers);
  const queryClient = useQueryClient();
  const isFutureQueriesPaused = usePauseFutureRequests((state) => state.isFutureQueriesPaused);
  const dataSourceMode = useDataSourceStore((s) => s.mode);
  const isLocalMode = dataSourceMode === 'local';

  // Get headers from both the store and the headerProvider (if configured)
  const globalHeaders = useMemo(() => {
    const providerHeaders = headerProvider ? headerProvider() : undefined;
    return { ...providerHeaders, ...storeHeaders };
  }, [storeHeaders, headerProvider]);

  // Default pagination configuration
  const pagination = useMemo(
    () => ({
      pageParamName: paginationConfig?.pageParamName || 'page',
      extractPagination:
        paginationConfig?.extractPagination ||
        ((response: IRequestSuccess<TResponse>): IPagination | undefined => {
          if ((response.data as any) && 'pagination' in response.data) {
            return response.data.pagination as IPagination;
          }
          return undefined;
        }),
      buildPageUrl:
        paginationConfig?.buildPageUrl ||
        ((basePath: string, page: number): string => {
          const [pathname, queryString] = basePath.split('?');
          const queryParams = new URLSearchParams(queryString || '');
          queryParams.set(paginationConfig?.pageParamName || 'page', String(page));
          return pathname + '?' + queryParams.toString();
        }),
    }),
    [paginationConfig]
  );

  /**
   * Core request function that makes the actual HTTP request
   */
  const executeRequest = useCallback(
    async (requestUrl: string): Promise<IRequestSuccess<TResponse>> => {
      const requestOptions = {
        path: requestUrl,
        headers: { ...globalHeaders, ...headers },
        baseURL: baseUrl ?? API_URL,
        timeout: TIMEOUT,
      };

      // Create the final handler that makes the actual request
      const finalHandler: MiddlewareNext<TResponse> = async (options) => {
        const finalOptions = options ? { ...requestOptions, ...options } : requestOptions;
        return await makeRequest<TResponse>(finalOptions);
      };

      let response: IRequestError | IRequestSuccess<TResponse>;

      // If middleware is available, execute the middleware chain
      if (middleware && Array.isArray(middleware) && middleware.length > 0) {
        const context: MiddlewareContext<TResponse> = {
          baseUrl: baseUrl ?? API_URL,
          path: requestUrl,
          options: requestOptions,
        };

        response = await executeMiddlewareChain<TResponse>(middleware, context, finalHandler);
      } else {
        response = await makeRequest<TResponse>(requestOptions);
      }

      if (response.status) {
        return response as IRequestSuccess<TResponse>;
      } else {
        throw response;
      }
    },
    [globalHeaders, headers, baseUrl, API_URL, TIMEOUT, middleware]
  );

  /**
   * Get the next page number from the response
   * Returns undefined if there are no more pages
   */
  const getNextPageParam = useCallback(
    (lastPage: IRequestSuccess<TResponse>): number | undefined => {
      const paginationData = pagination.extractPagination(lastPage);
      if (!paginationData) return undefined;

      // No more pages if next_page equals current_page or we're on the last page
      if (
        paginationData.next_page === paginationData.current_page ||
        paginationData.current_page >= paginationData.page_count
      ) {
        return undefined;
      }

      return paginationData.next_page;
    },
    [pagination]
  );

  /**
   * Get the previous page number from the response
   * Returns undefined if there are no previous pages
   */
  const getPreviousPageParam = useCallback(
    (firstPage: IRequestSuccess<TResponse>): number | undefined => {
      const paginationData = pagination.extractPagination(firstPage);
      if (!paginationData) return undefined;

      // No previous pages if we're on page 1 or previous equals current
      if (paginationData.previous_page === paginationData.current_page || paginationData.current_page <= 1) {
        return undefined;
      }

      return paginationData.previous_page;
    },
    [pagination]
  );

  // Destructure queryKey from queryOptions since it's deprecated and auto-generated
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { queryKey: _deprecatedQueryKey, ...restQueryOptions } = queryOptions ?? {};

  // The infinite query
  const query = useInfiniteQuery<
    IRequestSuccess<TResponse>,
    IRequestError,
    InfiniteData<IRequestSuccess<TResponse>>,
    readonly [string, object],
    number
  >({
    queryKey: [path, { __type: 'infinite' }] as const,
    queryFn: async ({ pageParam }) => {
      const requestUrl = pageParam === 1 ? path : pagination.buildPageUrl(path, pageParam);
      return executeRequest(requestUrl);
    },
    initialPageParam: 1,
    getNextPageParam,
    getPreviousPageParam,
    enabled: load === true && !isFutureQueriesPaused && !isLocalMode,
    ...restQueryOptions,
  });

  // Track query key for external reference
  useEffect(() => {
    if (keyTracker) {
      queryClient.setQueryDefaults([keyTracker], {
        staleTime: Infinity,
      });
      queryClient.setQueryData([keyTracker], [path, { __type: 'infinite' }]);
    }
  }, [keyTracker, path, queryClient]);

  const queryRef = useRef(query);
  queryRef.current = query;

  /**
   * Fetch next page of data
   */
  const fetchNextPage = useCallback(() => {
    if (queryRef.current.hasNextPage && !queryRef.current.isFetchingNextPage) {
      return queryRef.current.fetchNextPage();
    }
    return Promise.resolve();
  }, []);

  /**
   * Fetch previous page of data
   */
  const fetchPreviousPage = useCallback(() => {
    if (queryRef.current.hasPreviousPage && !queryRef.current.isFetchingPreviousPage) {
      return queryRef.current.fetchPreviousPage();
    }
    return Promise.resolve();
  }, []);

  /**
   * Refetch all pages
   */
  const refetch = useCallback(() => {
    return queryRef.current.refetch();
  }, []);

  /**
   * Fetch data with a new URL path (for dynamic filtering)
   * This invalidates the current query and fetches fresh data with the new path
   * @deprecated Consider using refetch() with updated path prop instead
   */
  const get = useCallback(
    async (newPath: string) => {
      if (isLocalMode) {
        return {} as IRequestSuccess<TResponse>;
      }
      queryClient.invalidateQueries({ queryKey: [path, { __type: 'infinite' }] });
      return executeRequest(newPath);
    },
    [queryClient, path, executeRequest, isLocalMode]
  );

  /**
   * Get all items from all pages flattened into a single array
   */
  const getAllItems = useCallback(
    <TItem>(itemExtractor: (page: IRequestSuccess<TResponse>) => TItem[]): TItem[] => {
      if (!query.data?.pages) return [];
      return query.data.pages.flatMap(itemExtractor);
    },
    [query.data?.pages]
  );

  /**
   * Get pagination data from the last fetched page
   */
  const getLatestPaginationData = useCallback((): IPagination | undefined => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!query.data?.pages?.length) return undefined;
    const lastPage = query.data.pages[query.data.pages.length - 1];
    if (!lastPage) return undefined;
    return pagination.extractPagination(lastPage);
  }, [query.data?.pages, pagination]);

  return {
    // Query state
    data: query.data,
    error: query.error,
    isLoading: query.isLoading || isFutureQueriesPaused,
    /** @deprecated Use isLoading instead */
    isInitialLoading: query.isLoading || isFutureQueriesPaused,
    isError: query.isError,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetchingPreviousPage: query.isFetchingPreviousPage,
    isRefetching: query.isRefetching,

    // Pagination state
    hasNextPage: query.hasNextPage,
    hasPreviousPage: query.hasPreviousPage,

    // Actions
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    /** @deprecated Use refetch() instead */
    get,

    // Utilities
    getAllItems,
    getLatestPaginationData,
    queryKey: [path, { __type: 'infinite' }] as const,

    // Raw query for advanced usage
    query,
  };
};
