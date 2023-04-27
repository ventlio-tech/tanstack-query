import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import type { RawAxiosRequestHeaders } from 'axios';
import React, { createContext, useCallback, useMemo, useState } from 'react';

export interface IRequestHeaderProvider {
  headers: RawAxiosRequestHeaders;
  setHeaders: (newHeaders: RawAxiosRequestHeaders) => void;
}

export const RequestHeaderProvider = createContext<IRequestHeaderProvider>({
  headers: {},
  setHeaders: (_newHeaders: IRequestHeaderProvider['headers']) => {
    //
  },
});

export const QueryClientRequestProvider = ({
  client,
  children,
}: {
  client: QueryClient;
  children: React.ReactNode;
}) => {
  const [headers, updateHeaders] = useState<IRequestHeaderProvider['headers']>(
    {}
  );

  const setHeaders = useCallback(
    (newHeaders: IRequestHeaderProvider['headers']) => {
      updateHeaders(newHeaders);
    },
    []
  );

  const requestContextValue = useMemo(
    () => ({ headers, setHeaders }),
    [headers, setHeaders]
  );

  return (
    <QueryClientProvider client={client}>
      <RequestHeaderProvider.Provider value={requestContextValue}>
        {children}
      </RequestHeaderProvider.Provider>
    </QueryClientProvider>
  );
};
