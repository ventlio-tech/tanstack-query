import { useStore } from '@tanstack/react-store';
import { bootStore } from './bootStore';
import type { IConfig } from './config.interface';
import { useReactNativeEnv } from './useReactNativeEnv';
import { useBaseUrlStore } from '../stores/useBaseUrlStore';

/**
 * Hook to access environment variables across different frameworks
 * Supports React (CRA), Next.js, Vite, and React Native
 */
export const useEnvironmentVariables = (): IConfig => {
  const { appTimeout, appUrl } = useReactNativeEnv();
  const { baseUrl } = useBaseUrlStore();
  const { environments } = useStore(bootStore);

  // Framework environment variables detection
  // Order of precedence:
  // 1. Runtime baseUrl (set via useBaseUrlStore)
  // 2. Bootstrap config environments
  // 3. Framework-specific environment variables
  // 4. React Native app URL

  // Get global object to check for various environment variables
  const globalObj = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {};

  // Check for Vite environment variables (without using import.meta directly)
  // @ts-ignore - Access potential Vite environment variables
  const viteEnv = globalObj.__VITE_ENV__ || {};
  const viteApiUrl = viteEnv.VITE_API_URL;
  const viteApiTimeout = viteEnv.VITE_API_TIMEOUT;

  // Get URL with fallbacks
  const url =
    baseUrl ??
    environments?.appBaseUrl ??
    process.env.REACT_APP_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    viteApiUrl ??
    appUrl;

  // Get timeout with fallbacks
  const timeout =
    environments?.appTimeout ??
    process.env.REACT_APP_API_TIMEOUT ??
    process.env.NEXT_PUBLIC_API_TIMEOUT ??
    viteApiTimeout ??
    appTimeout;

  return {
    API_URL: url as string,
    TIMEOUT: Number(timeout) || 30000, // Default timeout of 30 seconds
  };
};
