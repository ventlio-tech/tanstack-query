import type { RawAxiosRequestHeaders } from 'axios';

export interface TanstackQueryConfig {
  baseURL: string;
  timeout?: number;
  headers: RawAxiosRequestHeaders;
}
