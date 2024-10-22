import type { UseInfiniteQueryOptions, UseQueryOptions } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
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

export type TanstackInfiniteQueryOption<TResponse> = Partial<
  UseInfiniteQueryOptions<
    IRequestSuccess<TResponse | undefined>,
    IRequestError,
    IRequestSuccess<TResponse | undefined>,
    Array<any>
  >
>;

export interface DefaultRequestOptions {
  baseUrl?: string;
  headers?: RawAxiosRequestHeaders;
}
