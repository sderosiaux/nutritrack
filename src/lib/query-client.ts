import { QueryClient, type QueryKey } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,      // 1 min — don't refetch on every mount
        gcTime: 5 * 60 * 1000,    // 5 min cache retention
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

// Optimistic mutation helper — log entries appear instantly, rollback on error
export function createOptimisticMutation<TData, TInput>({
  queryClient,
  queryKey,
  mutationFn,
  updateCache,
}: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  mutationFn: (input: TInput) => Promise<TData>;
  updateCache: (old: TData[], input: TInput) => TData[];
}) {
  return {
    mutationFn,

    onMutate: async (input: TInput) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData[]>(queryKey);
      queryClient.setQueryData<TData[]>(queryKey, (old = []) =>
        updateCache(old, input)
      );
      return { previous };
    },

    onError: (
      _err: Error,
      _input: TInput,
      context: { previous: TData[] | undefined } | undefined
    ) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}
