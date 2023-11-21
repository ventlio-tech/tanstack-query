import type { BootstrapConfig, IUseQueryHeaders } from '../types';
import { useQueryConfig } from './useQueryConfig';

export const useQueryHeaders = (): IUseQueryHeaders => {
  const { setConfig, ...config } = useQueryConfig();

  const getHeaders = (): BootstrapConfig['headers'] => {
    return config.options?.headers;
  };

  const setQueryHeaders = (headers: BootstrapConfig['headers']) => {
    setConfig({ headers });
  };

  return { setQueryHeaders, getHeaders };
};
