import { QueryKey, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useEnvironmentVariables } from '../config';

import { useStore } from '@tanstack/react-store';
import { bootStore } from '../config/bootStore';
import { IRequestError, IRequestSuccess, makeRequest } from '../request';
import { executeMiddlewareChain } from '../request/make-request';
import { useHeaderStore, usePauseFutureRequests } from '../stores';
import type { MiddlewareContext, MiddlewareNext } from '../types';
import { DefaultRequestOptions, IPagination, TanstackQueryOption } from './queries.interface';

/**
 * Hook for making GET requests with pagination support
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
  const [options, setOptions] = useState<any>(queryOptions);
  const [page, setPage] = useState<number>(1);

  const { API_URL, TIMEOUT } = useEnvironmentVariables();
  const { middleware, pagination: globalPaginationConfig, headerProvider } = useStore(bootStore);

  const storeHeaders = useHeaderStore((state) => state.headers);

  // Get headers from both the store and the headerProvider (if configured)
  // headerProvider allows reading from cookies/localStorage synchronously
  const globalHeaders = useMemo(() => {
    const providerHeaders = headerProvider ? headerProvider() : undefined;
    // Merge: store headers take precedence over provider headers
    return { ...providerHeaders, ...storeHeaders };
  }, [storeHeaders, headerProvider]);

  const [requestPayload, setRequestPayload] = useState<Record<any, any>>();

  const isFutureQueriesPaused = usePauseFutureRequests((state) => state.isFutureQueriesPaused);

  let queryClient = useQueryClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  queryClient = useMemo(() => queryClient, []);

  // Merge global and local pagination config
  const pagination = useMemo(
    () => ({
      ...globalPaginationConfig,
      ...paginationConfig,
    }),
    [globalPaginationConfig, paginationConfig]
  );

  const sendRequest = async (
    res: (
      value: IRequestError | IRequestSuccess<TResponse> | PromiseLike<IRequestError | IRequestSuccess<TResponse>>
    ) => void,
    rej: (reason?: any) => void,
    queryKey: QueryKey
  ) => {
    const [url] = queryKey;
    const requestUrl = (url ?? requestPath) as string;

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
      res(getResponse as IRequestSuccess<TResponse>);
    } else {
      rej(getResponse);
    }
  };

  const query = useQuery<any, any, IRequestSuccess<TResponse>>({
    queryKey: [requestPath, {}],
    queryFn: ({ queryKey }) =>
      new Promise<IRequestSuccess<TResponse> | IRequestError>((res, rej) => sendRequest(res, rej, queryKey)),
    enabled: load && !isFutureQueriesPaused,
    ...options,
  });

  useEffect(() => {
    if (path) {
      setRequestPath(path);
    }
  }, [path]);

  useEffect(() => {
    if (keyTracker) {
      // set expiration time for the tracker
      queryClient.setQueryDefaults([keyTracker], {
        staleTime: Infinity,
      });

      queryClient.setQueryData([keyTracker], [requestPath, {}]);
    }
  }, [keyTracker, requestPath, queryClient, queryOptions?.staleTime]);

  /**
   * Extract pagination data from response using configured extractor
   */
  const getPaginationData = (response: IRequestSuccess<TResponse>): IPagination | undefined => {
    // Use the configured pagination extractor or fall back to default
    const extractPagination =
      pagination.extractPagination ||
      ((res) => {
        if ('pagination' in res.data) {
          return res.data.pagination as IPagination;
        }
        return undefined;
      });

    return extractPagination(response);
  };

  /**
   * Navigate to the next page if available
   */
  const nextPage = () => {
    // The linter thinks query.data is always falsy, but we know it can be defined after a successful query
    // Let's restructure to avoid the conditional
    const paginationData = (query as any).data && getPaginationData(query.data);
    if (!paginationData) return;

    if (
      paginationData.next_page !== paginationData.current_page &&
      paginationData.next_page > paginationData.current_page
    ) {
      setRequestPath(constructPaginationLink(requestPath, paginationData.next_page));
    }
  };

  /**
   * Navigate to the previous page if available
   */
  const prevPage = () => {
    // The linter thinks query.data is always falsy, but we know it can be defined after a successful query
    // Let's restructure to avoid the conditional
    const paginationData = (query as any).data && getPaginationData(query.data);
    if (!paginationData) return;

    if (
      paginationData.previous_page !== paginationData.current_page &&
      paginationData.previous_page < paginationData.current_page
    ) {
      setRequestPath(constructPaginationLink(requestPath, paginationData.previous_page));
    }
  };

  /**
   * Construct a pagination URL using the configured builder
   */
  const constructPaginationLink = (link: string, pageNumber: number) => {
    // Use the configured pagination URL builder or fall back to default
    const buildPaginationUrl =
      pagination.buildPaginationUrl ||
      ((url, page) => {
        const [pathname, queryString] = url.split('?');
        const queryParams = new URLSearchParams(queryString || '');
        const pageParamName = pagination.pageParamName || 'page';

        const oldPage = Number(queryParams.get(pageParamName));
        queryParams.set(pageParamName, String(page));

        const newUrl = pathname + '?' + queryParams.toString();

        // only update page when pagination number changed
        if (oldPage !== pageNumber) {
          setPage(pageNumber);
        }

        return newUrl;
      });

    return buildPaginationUrl(link, pageNumber);
  };

  /**
   * Navigate to a specific page
   */
  const gotoPage = (pageNumber: number) => {
    setRequestPath(constructPaginationLink(requestPath, pageNumber));
  };

  const updatedPathAsync = async (link: string) => {
    startTransition(() => {
      setRequestPath(link);
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
    if (!isFutureQueriesPaused) {
      await setOptionsAsync(fetchOptions);
      await updatedPathAsync(link);

      return query.data;
    } else {
      setRequestPayload({ link, fetchOptions });
      return undefined;
    }
  };

  useEffect(() => {
    if (!isFutureQueriesPaused && requestPayload) {
      get(requestPayload.link, requestPayload.fetchOptions);
      setRequestPayload(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFutureQueriesPaused]);

  return {
    ...query,
    isLoading: (query.isLoading as boolean) || isFutureQueriesPaused,
    setRequestPath,
    nextPage,
    prevPage,
    get,
    gotoPage,
    page,
    queryKey: [requestPath, {}],
    // Add pagination data accessor - restructured to avoid linter error
    getPaginationData: function () {
      return (query as any).data ? getPaginationData(query.data) : undefined;
    },
  };
};
