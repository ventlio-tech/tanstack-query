import { useQueryClient } from '@tanstack/react-query';
import { QueryModel } from './Model';
import { useKeyTrackerModel } from './useKeyTrackerModel';

export const useQueryModel = <T>(keyTracker: string): QueryModel<T> => {
  const queryClient = useQueryClient();
  const { getQueryKey } = useKeyTrackerModel(keyTracker);
  const queryKey = getQueryKey() as any[];
  return new QueryModel<T>(queryKey, queryClient);
};
