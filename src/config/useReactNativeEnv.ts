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
      if (config?.options?.environment === 'app') {
        const { REACT_NATIVE_API_TIMEOUT, REACT_NATIVE_API_URL } = await require('./loadReactNativeEnv');
        setAppUrl(REACT_NATIVE_API_URL);
        setAppTimeout(REACT_NATIVE_API_TIMEOUT);
      }
    };

    loadReactNativeEnvIfNeeded();
  }, [queryClient]);

  return { appUrl, appTimeout };
};
