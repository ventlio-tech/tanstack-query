import type { IConfig } from './config.interface';

export const useEnvironmentVariables = (): IConfig => {
  const url = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL;
  const timeout =
    process.env.REACT_APP_API_TIMEOUT || process.env.NEXT_PUBLIC_API_TIMEOUT;

  return {
    API_URL: url as string,
    TIMEOUT: Number(timeout),
  };
};
