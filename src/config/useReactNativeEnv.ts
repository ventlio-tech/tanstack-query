import { useQueryConfig } from './useQueryConfig';

export const useReactNativeEnv = () => {
  const config = useQueryConfig();

  const appUrl: string | undefined = config.options?.environments?.appBaseUrl;
  const appTimeout: number | undefined = config.options?.environments?.appTimeout;
  const isApp = config.options?.context === 'app';

  return { appUrl, appTimeout, isApp };
};
