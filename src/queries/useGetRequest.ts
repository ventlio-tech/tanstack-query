import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEnvironmentVariables } from '../config';

import { useStore } from '@tanstack/react-store';
import { bootStore } from '../config/bootStore';
import { usePowerSyncStore } from '../powersync/powersync-store';
import { usePowerSyncQuery } from '../powersync/usePowerSyncQuery';
import { IRequestError, IRequestSuccess, makeRequest } from '../request';
import { executeMiddlewareChain } from '../request/make-request';
import { useHeaderStore, usePauseFutureRequests } from '../stores';
import type { MiddlewareContext, MiddlewareNext } from '../types';
import { DefaultRequestOptions, IPagination, TanstackQueryOption } from './queries.interface';

/**
 * Hook for making GET requests with pagination support.
 * When PowerSync mode is active and a collection mapping exists for the path,
 * data is resolved from the local TanStack DB collection instead of HTTP.
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

  // Track when requestPath was intentionally changed via get() to prevent sync effect from resetting it
  const isIntentionalPathChangeRef = useRef(false);

  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { middleware, pagination: globalPaginationConfig, headerProvider } = useStore(bootStore);

  // PowerSync resolution — always called (rules of hooks) but only active when mode is 'powersync'
  const psStore = usePowerSyncStore();
  const psMapping = useMemo(() => {
    if (psStore.mode !== 'powersync' || !psStore.config) return null;
    return psStore.config.collections.resolve(requestPath);
  }, [psStore.mode, psStore.config, requestPath]);

  const isPowerSyncActive = psStore.mode === 'powersync' && psMapping !== null;

  const powerSyncResult = usePowerSyncQuery<TResponse>({
    mapping: psMapping,
    path: requestPath,
    load,
    enabled: isPowerSyncActive,
  });

  const storeHeaders = useHeaderStore((state) => state.headers);

  // Get headers from both the store and the headerProvider (if configured)
  // headerProvider allows reading from cookies/localStorage synchronously
  const globalHeaders = useMemo(() => {
    const providerHeaders = headerProvider ? headerProvider() : undefined;
    // Merge: store headers take precedence over provider headers
    return { ...providerHeaders, ...storeHeaders };
  }, [storeHeaders, headerProvider]);

  const isFutureQueriesPaused = usePauseFutureRequests((state) => state.isFutureQueriesPaused);

  const queryClient = useQueryClient();

  // Merge global and local pagination config
  const pagination = useMemo(
    () => ({
      ...globalPaginationConfig,
      ...paginationConfig,
    }),
    [globalPaginationConfig, paginationConfig]
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

      let getResponse: IRequestError | IRequestSuccess<TResponse>;

      // If middleware is available, execute the middleware chain
      if (middleware && Array.isArray(middleware) && middleware.length > 0) {
        const context: MiddlewareContext<TResponse> = {
          baseUrl: baseUrl ?? API_URL,
          path: requestUrl,
          options: requestOptions,
        };

        getResponse = await executeMiddlewareChain<TResponse>(middleware, context, finalHandler);
      } else {
        // Otherwise, just make the request directly
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

  // The declarative query - only runs when load is true AND PowerSync is NOT handling this path
  const query = useQuery({
    queryKey: [requestPath, {}] as const,
    queryFn: async ({ queryKey }) => {
      const [url] = queryKey;
      return executeRequest(url);
    },
    enabled: load === true && !isFutureQueriesPaused && !isPowerSyncActive,
    ...queryOptions,
  });

  // Update request path when prop changes (but not when intentionally changed via get())
  useEffect(() => {
    // Skip if the path change was intentional (from get() call)
    if (isIntentionalPathChangeRef.current) {
      isIntentionalPathChangeRef.current = false;
      return;
    }

    if (path && path !== requestPath) {
      setRequestPath(path);
    }
  }, [path, requestPath]);

  // Track query key for external reference
  useEffect(() => {
    if (keyTracker) {
      queryClient.setQueryDefaults([keyTracker], {
        staleTime: Infinity,
      });
      queryClient.setQueryData([keyTracker], [requestPath, {}]);
    }
  }, [keyTracker, requestPath, queryClient, queryOptions?.staleTime]);

  /**
   * Extract pagination data from response using configured extractor
   */
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

  /**
   * Construct a pagination URL using the configured builder
   */
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

  /**
   * Navigate to the next page if available
   */
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

  /**
   * Navigate to the previous page if available
   */
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

  /**
   * Navigate to a specific page
   */
  const gotoPage = useCallback(
    (pageNumber: number) => {
      const newPath = constructPaginationLink(requestPath, pageNumber);
      setRequestPath(newPath);
      setPage(pageNumber);
    },
    [constructPaginationLink, requestPath]
  );

  /**
   * Imperative GET request - fetches data from a dynamic URL
   * Uses queryClient.fetchQuery for proper caching and deduplication.
   * By default, also updates the component's subscription to show the new data.
   *
   * @param url - The URL to fetch from
   * @param fetchOptions - Optional query options (staleTime, gcTime, updateSubscription)
   * @param fetchOptions.updateSubscription - If true (default), updates the
   * component's subscription to the new URL, triggering a re-render with new data.
   * Set to false for prefetching without UI update.
   * @returns Promise resolving to the response data
   */
  const get = useCallback(
    async (
      url: string,
      fetchOptions?: {
        staleTime?: number;
        gcTime?: number;
        /** If true (default), updates the component's subscription to show the
         * new data. Set to false for prefetching. */
        updateSubscription?: boolean;
      }
    ): Promise<IRequestSuccess<TResponse>> => {
      if (isFutureQueriesPaused) {
        throw new Error('Queries are currently paused');
      }

      const { staleTime, gcTime, updateSubscription = true } = fetchOptions ?? {};

      // Update the subscription so the component re-renders with the new data
      if (updateSubscription) {
        // Mark this as an intentional change to prevent sync effect from resetting it
        isIntentionalPathChangeRef.current = true;
        setRequestPath(url);
      }

      // Use fetchQuery for imperative fetching - this properly handles caching
      const result = await queryClient.fetchQuery({
        queryKey: [url, {}] as const,
        queryFn: () => executeRequest(url),
        staleTime,
        gcTime,
      });

      return result;
    },
    [queryClient, executeRequest, isFutureQueriesPaused, setRequestPath]
  );

  /**
   * Refetch the current query with the existing path
   */
  const refetch = useCallback(() => {
    return query.refetch();
  }, [query]);

  // When PowerSync mode is active with a valid mapping, return PowerSync results
  if (isPowerSyncActive) {
    return powerSyncResult as any;
  }

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
