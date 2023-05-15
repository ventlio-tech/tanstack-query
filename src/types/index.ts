import type { RawAxiosRequestHeaders } from 'axios';

export interface BootstrapQueryRequest {
  environment: 'app' | 'web' | 'electronjs';
}

export interface TanstackQueryConfig {
  headers: RawAxiosRequestHeaders;
  options?: BootstrapQueryRequest;
}

export interface IUseQueryHeaders {
  getHeaders: () => TanstackQueryConfig['headers'];
  setQueryHeaders: (header: TanstackQueryConfig['headers']) => void;
}
