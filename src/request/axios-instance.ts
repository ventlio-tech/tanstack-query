import type { AxiosInstance, RawAxiosRequestHeaders } from 'axios';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

export const axiosInstance = (
  headers: RawAxiosRequestHeaders
): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 100000,
    headers,
  });
};
