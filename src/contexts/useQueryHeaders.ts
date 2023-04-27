import { useContext } from 'react';
import type { IRequestHeaderProvider } from './QueryClientRequestProvider';
import { RequestHeaderProvider } from './QueryClientRequestProvider';

export const useQueryHeaders = (): IRequestHeaderProvider => {
  return useContext(RequestHeaderProvider);
};
