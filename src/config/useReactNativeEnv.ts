import { useQueryClient } from '@tanstack/react-query';
import type { TanstackQueryConfig } from '../types';

export const useReactNativeEnv = () => {
  const queryClient = useQueryClient();
  const config = queryClient.getQueryData<TanstackQueryConfig>(['config']);

  const appUrl: string | undefined = config?.options?.environments?.appBaseUrl;
  const appTimeout: number | undefined = config?.options?.environments?.appTimeout;
  const isApp = config?.options?.context === 'app';

  return { appUrl, appTimeout, isApp };
};
