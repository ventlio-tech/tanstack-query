import type { RawAxiosRequestHeaders } from 'axios';

export interface TanstackQueryConfig {
  headers: RawAxiosRequestHeaders;
}

export interface IUseQueryHeaders {
  getHeadersAsync: () => Promise<RawAxiosRequestHeaders>;
  setQueryHeaders: (header: TanstackQueryConfig['headers']) => void;
}
