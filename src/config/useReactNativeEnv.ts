import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { TanstackQueryConfig } from '../types';

export const useReactNativeEnv = () => {
  const queryClient = useQueryClient();

  const [appUrl, setAppUrl] = useState<string | undefined>(undefined);
  const [appTimeout, setAppTimeout] = useState<number | undefined>();

  useEffect(() => {
    const config = queryClient.getQueryData<TanstackQueryConfig>(['config']);

    const loadReactNativeEnvIfNeeded = async () => {
      if (config?.options?.context === 'app') {
        const API_URL = config.options.environments?.appBaseUrl;
        const API_TIMEOUT = config.options.environments?.appTimeout;

        setAppUrl(API_URL);
        setAppTimeout(API_TIMEOUT);
      }
    };

    loadReactNativeEnvIfNeeded();
  }, [queryClient]);

  return { appUrl, appTimeout };
};
