import type { RawAxiosRequestHeaders } from 'axios';

export interface TanstackQueryConfig {
  headers: RawAxiosRequestHeaders;
}

export interface IUseQueryHeaders {
  getHeadersAsync: () => Promise<TanstackQueryConfig>;
  setQueryHeaders: (header: TanstackQueryConfig['headers']) => void;
}
