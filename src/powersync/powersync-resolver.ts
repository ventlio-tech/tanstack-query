import { usePowerSyncStore } from './powersync-store';
import type { CollectionMapping, ResolvedFilters } from './powersync.interface';

/**
 * Parses an API path into its constituent parts: resource name, optional ID,
 * and query parameters translated into ResolvedFilters.
 *
 * Examples:
 *   "/stocks"                       -> { resource: "stocks", filters: {} }
 *   "/stocks/abc-123"              -> { resource: "stocks", filters: { id: "abc-123" } }
 *   "/stocks?search=foo&page=2"    -> { resource: "stocks", filters: { search: "foo", page: 2 } }
 */
export function parseApiPath(apiPath: string): { resource: string; filters: ResolvedFilters } {
  const [pathPart = '', queryString] = apiPath.split('?');

  const segments = pathPart.split('/').filter((s) => s.length > 0);

  const resource = segments[0] ?? '';
  const id = segments.length > 1 ? segments[segments.length - 1] : undefined;

  const filters: ResolvedFilters = {};

  if (id && id !== resource) {
    filters.id = id;
  }

  if (queryString) {
    const params = new URLSearchParams(queryString);

    const search = params.get('search');
    if (search) filters.search = search;

    const filter = params.get('filter');
    if (filter) filters.filter = filter;

    const page = params.get('page');
    if (page) filters.page = parseInt(page, 10) || 1;

    const size = params.get('size');
    if (size) filters.size = parseInt(size, 10) || 20;

    const startDate = params.get('startDate');
    if (startDate) filters.startDate = startDate;

    const endDate = params.get('endDate');
    if (endDate) filters.endDate = endDate;

    params.forEach((value, key) => {
      if (!['search', 'filter', 'page', 'size', 'startDate', 'endDate'].includes(key)) {
        filters[key] = value;
      }
    });
  }

  if (!filters.page) filters.page = 1;
  if (!filters.size) filters.size = 20;

  return { resource, filters };
}

/**
 * Attempts to resolve an API path to a PowerSync collection mapping.
 * Returns null if PowerSync mode is not active or no mapping exists.
 */
export function resolvePathToCollection(apiPath: string): (CollectionMapping & { filters: ResolvedFilters }) | null {
  const store = usePowerSyncStore.getState();

  if (store.mode !== 'powersync' || !store.config) {
    return null;
  }

  const mapping = store.config.collections.resolve(apiPath);
  if (!mapping) {
    return null;
  }

  const { filters } = parseApiPath(apiPath);

  return {
    ...mapping,
    filters: { ...mapping.filters, ...filters },
  };
}

/**
 * Builds default client-side pagination from total row count.
 */
export function buildDefaultPagination(totalRows: number, page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(totalRows / size));
  const currentPage = Math.min(page, pageCount);

  return {
    current_page: currentPage,
    next_page: Math.min(currentPage + 1, pageCount),
    previous_page: Math.max(currentPage - 1, 1),
    page_count: pageCount,
    size,
    total: totalRows,
  };
}

/**
 * Applies client-side pagination to a row array.
 */
export function applyClientPagination<T>(rows: T[], page: number, size: number): T[] {
  const start = (page - 1) * size;
  return rows.slice(start, start + size);
}
