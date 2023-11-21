import type { QueryKey } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
import type { IMakeRequest } from '../request';

export interface BootstrapConfig {
  environments?: {
    appBaseUrl: string;
    appTimeout: number;
  };
  context?: ContextType;
  modelConfig?: BootstrapModelConfig;
  mutationMiddleware?: (mutateRequestConfig?: IMakeRequest & { mutationKey: QueryKey }) => Promise<boolean>;
  queryMiddleware?: (queryRequestConfig?: IMakeRequest & { queryKey: QueryKey }) => Promise<boolean>;
  pauseFutureMutations?: boolean;
  pauseFutureQueries?: boolean;
  headers?: RawAxiosRequestHeaders;
}

export interface BootstrapModelConfig {
  idColumn: string;
}

export type ContextType = 'app' | 'web' | 'electronjs';
export interface TanstackQueryConfig {
  options: BootstrapConfig;
  setConfig: (options: BootstrapConfig) => void;
}

export interface IUseQueryHeaders {
  getHeaders: () => BootstrapConfig['headers'];
  setQueryHeaders: (header: BootstrapConfig['headers']) => void;
}
