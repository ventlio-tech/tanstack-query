import type { QueryClient } from '@tanstack/react-query';
import 'url-search-params-polyfill';
import type { BootstrapConfig, IPagination, LegacyMiddlewareFunction, MiddlewareFunction } from '../types';
import { bootStore } from './bootStore';

/**
 * Bootstrap the query request system with configuration options
 *
 * @param queryClient - TanStack Query client instance
 * @param options - Configuration options
 */
export const bootstrapQueryRequest = async (queryClient: QueryClient, options: BootstrapConfig = {}): Promise<void> => {
  // Resume any paused mutations
  await queryClient.resumePausedMutations();

  // Set default pagination configuration if not provided
  if (!options.pagination) {
    options.pagination = {
      pageParamName: 'page',
      buildPaginationUrl: (url: string, page: number) => {
        const [pathname, queryString] = url.split('?');
        const queryParams = new URLSearchParams(queryString);
        queryParams.set('page', String(page));
        return pathname + '?' + queryParams.toString();
      },
      extractPagination: <T>(response: any) => {
        // Default pagination extraction from response
        if (response.data && 'pagination' in response.data) {
          return response.data.pagination as IPagination;
        }
        return undefined;
      },
    };
  }

  // Convert legacy middleware to new format if needed
  if (options.middleware && !Array.isArray(options.middleware)) {
    const legacyMiddleware = options.middleware as LegacyMiddlewareFunction;

    // Create a new middleware function that adapts the legacy format
    const adaptedMiddleware: MiddlewareFunction = async (context, next) => {
      return await legacyMiddleware((opts) => next(opts), {
        baseUrl: context.baseUrl,
        path: context.path,
        body: context.body,
      });
    };

    // Replace with array containing the adapted middleware
    options.middleware = [adaptedMiddleware];
  }

  // Store the configuration
  bootStore.setState(() => options);
};
