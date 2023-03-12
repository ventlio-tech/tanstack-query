import type { UseQueryOptions } from '@tanstack/react-query';
import type { IRequestError, IRequestSuccess } from '../request';

export interface IPagination {
  current_page: number;
  next_page: number;
  page_count: number;
  previous_page: number;
  size: number;
  total: number;
}

export type TanstackQueryOption<TResponse> = UseQueryOptions<
  IRequestSuccess<TResponse | undefined>,
  IRequestError,
  IRequestSuccess<TResponse | undefined>,
  Array<any>
>;
