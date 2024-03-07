import { create } from 'zustand';
import type { QueryHeaders } from '../types';

interface IUserHeaders {
  headers: QueryHeaders | undefined;
  setHeader: (headers: QueryHeaders) => void;
}
export const useHeaderStore = create<IUserHeaders>((set) => ({
  headers: undefined,
  setHeader(headers) {
    set({ headers });
  },
}));
