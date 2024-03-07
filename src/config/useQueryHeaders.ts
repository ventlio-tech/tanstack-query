import { useHeaderStore } from '../stores';
import type { IUseQueryHeaders, QueryHeaders } from '../types';

export const useQueryHeaders = (): IUseQueryHeaders => {
  const { headers, setHeader } = useHeaderStore();

  const getHeaders = (): QueryHeaders => {
    return headers;
  };

  const setQueryHeaders = (newHeaders: QueryHeaders) => {
    setHeader(newHeaders);
  };

  return { setQueryHeaders, getHeaders };
};
