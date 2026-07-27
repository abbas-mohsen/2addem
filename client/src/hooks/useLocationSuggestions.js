import { useQuery } from '@tanstack/react-query';
import { metaApi } from '../api/endpoints.js';

/* Reference data that never changes during a session, so it is fetched once
   and shared by the board filter and the job editor. */
export function useLocationSuggestions() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => (await metaApi.locations()).locations,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
