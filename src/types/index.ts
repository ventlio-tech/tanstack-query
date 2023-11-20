import type { RawAxiosRequestHeaders } from 'axios';

export interface BootstrapConfig {
  environments?: {
    appBaseUrl: string;
    appTimeout: number;
  };
  context?: ContextType;
  modelConfig?: BootstrapModelConfig;
  mutationMiddleware?: (mutateRequest?: any, mutateResponse?: any) => Promise<boolean>;
  queryMiddleware?: (queryRequest?: any, queryResponse?: any) => Promise<boolean>;
}

export interface BootstrapModelConfig {
  idColumn: string;
}

export type ContextType = 'app' | 'web' | 'electronjs';
export interface TanstackQueryConfig {
  headers: RawAxiosRequestHeaders;
  options?: BootstrapConfig;
}

export interface IUseQueryHeaders {
  getHeaders: () => TanstackQueryConfig['headers'];
  setQueryHeaders: (header: TanstackQueryConfig['headers']) => void;
}
