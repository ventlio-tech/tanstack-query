import { create } from 'zustand';

export interface PauseFutureRequest {
  isFutureQueriesPaused: boolean;
  isFutureMutationsPaused: boolean;

  pauseFutureMutation: (status: boolean) => void;
  pauseFutureQueries: (status: boolean) => void;
}

export const usePauseFutureRequests = create<PauseFutureRequest>((set) => {
  const pauseFutureQueries = (status: boolean) => {
    return set({ isFutureQueriesPaused: status });
  };
  const pauseFutureMutation = (status: boolean) => {
    return set({ isFutureQueriesPaused: status });
  };

  return {
    isFutureMutationsPaused: false,
    isFutureQueriesPaused: false,
    pauseFutureQueries,
    pauseFutureMutation,
  };
});
