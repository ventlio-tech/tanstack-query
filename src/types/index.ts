import type { AxiosProgressEvent, RawAxiosRequestHeaders } from 'axios';
import type { AppFileConfig, HttpMethod, IMakeRequest, IRequestError, IRequestSuccess } from '../request';
import type { IPagination } from '../queries';

// Enhanced middleware types
export type MiddlewareFunction<T = any> = (
  context: MiddlewareContext<T>,
  next: MiddlewareNext<T>
) => Promise<IRequestError | IRequestSuccess<T>>;

export interface MiddlewareContext<T = any> {
  baseUrl: string;
  path: string;
  body?: Record<string, any>;
  method?: HttpMethod;
  headers?: RawAxiosRequestHeaders;
  options?: Partial<NextOptions>;
  response?: IRequestError | IRequestSuccess<T>;
}

export type MiddlewareNext<T = any> = (options?: Partial<NextOptions>) => Promise<IRequestError | IRequestSuccess<T>>;

// Legacy middleware type for backward compatibility
export type LegacyMiddlewareFunction<T = any> = (
  next: (options?: Partial<NextOptions>) => Promise<IRequestSuccess<T> | IRequestError>,
  configs?: { baseUrl: string; path: string; body?: Record<string, any> }
) => Promise<IRequestError | IRequestSuccess<T>>;

export interface BootstrapConfig {
  environments?: {
    appBaseUrl: string;
    appTimeout: number;
  };
  context?: ContextType;
  modelConfig?: BootstrapModelConfig;
  // Support both new middleware array and legacy middleware function
  middleware?: MiddlewareFunction[] | LegacyMiddlewareFunction;
  // Custom pagination configuration
  pagination?: PaginationConfig;
}

export interface PaginationConfig {
  // Function to extract pagination data from response
  extractPagination?: <T>(response: IRequestSuccess<T>) => IPagination | undefined;
  // Function to build pagination URL
  buildPaginationUrl?: (url: string, page: number) => string;
  // Default page parameter name
  pageParamName?: string;
}

export interface NextOptions extends Partial<IMakeRequest> {
  baseURL: string;
  timeout: number;
  path: string;
  body: any;
  method: HttpMethod;
  isFormData: boolean;
  headers: RawAxiosRequestHeaders;
  appFileConfig: AppFileConfig;
  onUploadProgress: (progressEvent: AxiosProgressEvent) => void;
}

export interface BootstrapModelConfig {
  idColumn: string;
}

export type ContextType = 'app' | 'web' | 'electronjs';
export interface TanstackQueryConfig {
  options?: BootstrapConfig;
}

export interface IUseQueryHeaders {
  getHeaders: () => QueryHeaders;
  setQueryHeaders: (header: QueryHeaders) => void;
}

export type QueryHeaders = RawAxiosRequestHeaders | undefined;
