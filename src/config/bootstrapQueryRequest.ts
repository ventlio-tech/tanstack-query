import type { QueryClient } from '@tanstack/react-query';
import 'url-search-params-polyfill';
import type { IPagination } from '../queries';
import type { BootstrapConfig, LegacyMiddlewareFunction, MiddlewareFunction } from '../types';
import { bootStore } from './bootStore';

/**
 * Bootstrap the query request system with configuration options
 *
 * @param queryClient - TanStack Query client instance
 * @param options - Configuration options
 */
export const bootstrapQueryRequest = async (queryClient: QueryClient, options: BootstrapConfig = {}): Promise<void> => {
  await queryClient.resumePausedMutations();

  if (!options.pagination) {
    options.pagination = {
      pageParamName: 'page',
      buildPaginationUrl: (url: string, page: number) => {
        const [pathname, queryString] = url.split('?');
        const queryParams = new URLSearchParams(queryString);
        queryParams.set('page', String(page));
        return pathname + '?' + queryParams.toString();
      },
      extractPagination: (response: any) => {
        if (response.data && 'pagination' in response.data) {
          return response.data.pagination as IPagination;
        }
        return undefined;
      },
    };
  }

  if (options.middleware && !Array.isArray(options.middleware)) {
    const legacyMiddleware = options.middleware as LegacyMiddlewareFunction;

    const adaptedMiddleware: MiddlewareFunction = async (context, next) => {
      return await legacyMiddleware((opts) => next(opts), {
        baseUrl: context.baseUrl,
        path: context.path,
        body: context.body,
      });
    };

    options.middleware = [adaptedMiddleware];
  }

  bootStore.setState(() => options);
};
