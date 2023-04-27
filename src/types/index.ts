import type { RawAxiosRequestHeaders } from 'axios';

export interface TanstackQueryConfig {
  headers: RawAxiosRequestHeaders;
}

export interface IUseQueryHeaders {
  headers: TanstackQueryConfig['headers'];
  setQueryHeaders: (header: TanstackQueryConfig['headers']) => void;
}
