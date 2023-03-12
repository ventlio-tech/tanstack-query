import type { AxiosInstance, RawAxiosRequestHeaders } from 'axios';
import axios from 'axios';

export const axiosInstance = (
  headers: RawAxiosRequestHeaders
): AxiosInstance => {
  return axios.create({
    baseURL: 'https://api.ventlio.com',
    timeout: 100000,
    headers,
  });
};
