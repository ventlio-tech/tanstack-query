import type { IConfig } from './config.interface';
import { useReactNativeEnv } from './useReactNativeEnv';

export const useEnvironmentVariables = (): IConfig => {
  const { appTimeout, appUrl } = useReactNativeEnv();
  const url = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || appUrl;
  const timeout = process.env.REACT_APP_API_TIMEOUT || process.env.NEXT_PUBLIC_API_TIMEOUT || appTimeout;

  return {
    API_URL: url as string,
    TIMEOUT: Number(timeout),
  };
};
