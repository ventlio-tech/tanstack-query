import type { RawAxiosRequestHeaders } from 'axios';

export interface BootstrapQueryRequest {
  environments?: {
    appBaseUrl: string;
    appTimeout: number;
  };
  context?: 'app' | 'web' | 'electronjs';
}

export interface TanstackQueryConfig {
  headers: RawAxiosRequestHeaders;
  options?: BootstrapQueryRequest;
}

export interface IUseQueryHeaders {
  getHeaders: () => TanstackQueryConfig['headers'];
  setQueryHeaders: (header: TanstackQueryConfig['headers']) => void;
}
