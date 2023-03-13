import type { QueryFilters } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

export const useQueryModel = (
  queryKey: any[],
  filters?: QueryFilters | undefined
) => {
  const queryClient = useQueryClient();

  return queryClient.getQueryData(queryKey, filters);
};
