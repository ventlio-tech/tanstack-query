import { useCallback, useEffect, useRef, useState } from 'react';
import type { IPagination } from '../queries/queries.interface';
import type { IRequestSuccess } from '../request/request.interface';
import { applyClientPagination, buildDefaultPagination, parseApiPath } from './powersync-resolver';
import { usePowerSyncStore } from './powersync-store';
import type { CollectionMapping, PowerSyncQueryResult } from './powersync.interface';

/**
 * Internal hook that queries a TanStack DB collection and returns data
 * in the same IRequestSuccess shape as the HTTP path.
 *
 * This hook is called unconditionally (React rules of hooks) but only
 * produces data when PowerSync mode is active and a mapping is resolved.
 *
 * The consumer's `CollectionRegistry.resolve()` provides `transformResponse`
 * which wraps raw rows into the API envelope shape.
 */
export function usePowerSyncQuery<TResponse extends Record<string, unknown>>({
  mapping,
  path,
  load = false,
  enabled = true,
}: {
  mapping: CollectionMapping | null;
  path: string;
  load?: boolean;
  enabled?: boolean;
}): PowerSyncQueryResult<TResponse> {
  const [requestPath, setRequestPath] = useState<string>(path);
  const [page, setPage] = useState<number>(1);
  const [queryResult, setQueryResult] = useState<IRequestSuccess<TResponse> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(load && enabled && mapping !== null);
  const [error, setError] = useState<unknown>(null);
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  const store = usePowerSyncStore();

  useEffect(() => {
    if (path !== requestPath) {
      setRequestPath(path);
    }
  }, [path, requestPath]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const executeQuery = useCallback(
    async (targetPath: string): Promise<IRequestSuccess<TResponse> | undefined> => {
      if (!mapping || !enabled) return undefined;

      const { filters } = parseApiPath(targetPath);
      const spaceId = store.config?.getSpaceId?.() ?? null;

      try {
        setIsLoading(true);
        setError(null);

        /**
         * The collection is a TanStack DB collection. We call its internal
         * query method via the consumer-provided transformResponse.
         * The consumer's CollectionRegistry is responsible for actually
         * executing the live query and returning rows.
         *
         * At this layer, we treat the collection as opaque and rely on
         * transformResponse to produce the correct data shape.
         */
        const collection = mapping.collection as {
          getAll?: () => unknown[];
          state?: { data?: unknown[] };
        };

        let rows: unknown[] = [];

        if ('state' in collection && collection.state && Array.isArray((collection.state as any).data)) {
          rows = (collection.state as any).data;
        } else if ('getAll' in collection && typeof collection.getAll === 'function') {
          rows = collection.getAll();
        }

        if (mapping.spaceScoped && spaceId) {
          rows = rows.filter((row: any) => row.space_id === spaceId);
        }

        if (filters.id) {
          rows = rows.filter((row: any) => row.id === filters.id);
        }

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          rows = rows.filter((row: any) => {
            return Object.values(row).some((val) => typeof val === 'string' && val.toLowerCase().includes(searchLower));
          });
        }

        if (filters.startDate) {
          rows = rows.filter((row: any) => {
            const createdAt = row.created_at || row.createdAt;
            return createdAt && createdAt >= filters.startDate!;
          });
        }

        if (filters.endDate) {
          rows = rows.filter((row: any) => {
            const createdAt = row.created_at || row.createdAt;
            return createdAt && createdAt <= filters.endDate!;
          });
        }

        const totalRows = rows.length;
        const currentPage = filters.page ?? 1;
        const size = filters.size ?? 20;

        const paginatedRows = applyClientPagination(rows, currentPage, size);

        const pagination = mapping.transformPagination
          ? mapping.transformPagination(totalRows, currentPage, size)
          : buildDefaultPagination(totalRows, currentPage, size);

        const responseData = mapping.transformResponse
          ? mapping.transformResponse(paginatedRows, filters)
          : { [mapping.tableName]: paginatedRows, pagination };

        const result: IRequestSuccess<TResponse> = {
          status: true,
          statusCode: 200,
          message: 'Data loaded from local database',
          timeStamp: new Date(),
          data: responseData as TResponse,
        };

        if (mountedRef.current) {
          setQueryResult(result);
          setPage(currentPage);
          setIsLoading(false);
          initialLoadDoneRef.current = true;
        }

        return result;
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
          setIsLoading(false);
        }
        return undefined;
      }
    },
    [mapping, enabled, store.config]
  );

  useEffect(() => {
    if (load && enabled && mapping && !initialLoadDoneRef.current) {
      executeQuery(requestPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, enabled, requestPath]);

  useEffect(() => {
    if (initialLoadDoneRef.current && enabled && mapping) {
      executeQuery(requestPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestPath, enabled]);

  const get = useCallback(
    async (url: string): Promise<IRequestSuccess<TResponse>> => {
      setRequestPath(url);
      const result = await executeQuery(url);
      if (!result) {
        throw new Error('PowerSync query failed or is not available');
      }
      return result;
    },
    [executeQuery]
  );

  const refetch = useCallback(() => {
    executeQuery(requestPath);
  }, [executeQuery, requestPath]);

  const nextPage = useCallback(() => {
    const { filters } = parseApiPath(requestPath);
    const currentPage = filters.page ?? 1;
    const newPage = currentPage + 1;

    const [pathPart, queryString] = requestPath.split('?');
    const params = new URLSearchParams(queryString || '');
    params.set('page', String(newPage));
    const newPath = pathPart + '?' + params.toString();

    setRequestPath(newPath);
    setPage(newPage);
  }, [requestPath]);

  const prevPage = useCallback(() => {
    const { filters } = parseApiPath(requestPath);
    const currentPage = filters.page ?? 1;
    if (currentPage <= 1) return;

    const newPage = currentPage - 1;
    const [pathPart, queryString] = requestPath.split('?');
    const params = new URLSearchParams(queryString || '');
    params.set('page', String(newPage));
    const newPath = pathPart + '?' + params.toString();

    setRequestPath(newPath);
    setPage(newPage);
  }, [requestPath]);

  const gotoPage = useCallback(
    (targetPage: number) => {
      const [pathPart, queryString] = requestPath.split('?');
      const params = new URLSearchParams(queryString || '');
      params.set('page', String(targetPage));
      const newPath = pathPart + '?' + params.toString();

      setRequestPath(newPath);
      setPage(targetPage);
    },
    [requestPath]
  );

  const getPaginationData = useCallback((): IPagination | undefined => {
    if (!queryResult?.data) return undefined;
    const data = queryResult.data as any;
    return data?.pagination ?? undefined;
  }, [queryResult]);

  return {
    data: queryResult,
    isLoading,
    isFetching: isLoading,
    isInitialLoading: isLoading && !initialLoadDoneRef.current,
    error,
    refetch,
    get,
    setRequestPath,
    nextPage,
    prevPage,
    gotoPage,
    page,
    queryKey: [requestPath, {}] as const,
    getPaginationData,
  };
}
