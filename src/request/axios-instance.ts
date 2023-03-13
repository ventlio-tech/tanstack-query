import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type { IMakeRequest } from './request.interface';

export const axiosInstance = ({
  baseURL,
  timeout,
  headers,
}: Partial<IMakeRequest>): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout,
    headers,
  });
};
