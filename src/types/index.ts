import type { RawAxiosRequestHeaders } from 'axios';

export interface TanstackQueryConfig {
  headers: RawAxiosRequestHeaders;
}

export interface IUseQueryHeaders {
  getHeaders: () => TanstackQueryConfig['headers'];
  setQueryHeaders: (header: TanstackQueryConfig['headers']) => void;
}
