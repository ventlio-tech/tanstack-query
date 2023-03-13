import type { RawAxiosRequestHeaders } from 'axios';

export interface TanstackQueryConfig {
  baseURL: string;
  timeout?: number;
  headers: RawAxiosRequestHeaders;
}

export interface IUseQueryHeaders {
  headers: TanstackQueryConfig['headers'];
  setQueryHeaders: (header: TanstackQueryConfig['headers']) => void;
}

export interface IUseQueryTimeout {
  timeout: TanstackQueryConfig['timeout'];
  setQueryTimeout: (timeout: TanstackQueryConfig['timeout']) => void;
}

export interface IUseQueryBaseURL {
  baseURL: TanstackQueryConfig['baseURL'];
  setQueryBaseUrl: (baseURL: TanstackQueryConfig['baseURL']) => void;
}
