import type { IPagination } from '../queries/queries.interface';
import type { IRequestSuccess } from '../request/request.interface';

export type DataSourceMode = 'api' | 'powersync';

/**
 * Configuration provided by the consumer to enable PowerSync data source.
 */
export interface PowerSyncConfig {
  mode: DataSourceMode;
  collections: CollectionRegistry;
  getSpaceId?: () => string | null;
}

/**
 * Registry that maps API paths to TanStack DB collections.
 * Implemented by the consumer to define their path-to-collection mapping.
 */
export interface CollectionRegistry {
  resolve(apiPath: string): CollectionMapping | null;
}

/**
 * Describes how a resolved API path maps to a TanStack DB collection.
 */
export interface CollectionMapping {
  /** The TanStack DB collection instance (generic to avoid hard dependency) */
  collection: unknown;
  /** The underlying table name in the PowerSync schema */
  tableName: string;
  /** Whether this collection requires space_id filtering */
  spaceScoped: boolean;
  /** Parsed filters from the API path (e.g. search, status, id) */
  filters?: ResolvedFilters;
  /**
   * Transform raw collection rows into the expected API response shape.
   * Must return the `data` field content of IRequestSuccess.
   */
  transformResponse?: (rows: unknown[], filters?: ResolvedFilters) => unknown;
  /**
   * Build pagination metadata from the full row set and current page/size.
   * If not provided, a default client-side pagination is applied.
   */
  transformPagination?: (totalRows: number, page: number, size: number) => IPagination;
}

/**
 * Filters extracted from an API path's query parameters and path segments.
 */
export interface ResolvedFilters {
  id?: string;
  search?: string | null;
  filter?: string | null;
  page?: number;
  size?: number;
  startDate?: string | null;
  endDate?: string | null;
  [key: string]: unknown;
}

/**
 * Options passed to the internal PowerSync query hook.
 */
export interface PowerSyncQueryOptions {
  mapping: CollectionMapping;
  path: string;
  load?: boolean;
  spaceId?: string | null;
  queryOptions?: Record<string, unknown>;
}

/**
 * Options passed to the internal PowerSync mutation hook.
 */
export interface PowerSyncMutationOptions {
  mapping: CollectionMapping;
  path: string;
  spaceId?: string | null;
}

/**
 * The shape returned by the PowerSync query hook,
 * matching the return signature of useGetRequest.
 */
export interface PowerSyncQueryResult<TResponse> {
  data: IRequestSuccess<TResponse> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isInitialLoading: boolean;
  error: unknown;
  refetch: () => void;
  get: (url: string, fetchOptions?: Record<string, unknown>) => Promise<IRequestSuccess<TResponse>>;
  setRequestPath: (path: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  gotoPage: (page: number) => void;
  page: number;
  queryKey: readonly [string, Record<string, never>];
  getPaginationData: () => IPagination | undefined;
}
