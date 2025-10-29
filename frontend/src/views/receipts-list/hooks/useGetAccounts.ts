import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getApiLedgerAccounts } from '../../../api/generated/api';

export function useAccounts() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['ledgerAccounts', 'Assets'],
        queryFn: () => getApiLedgerAccounts({ type: 'Assets' }),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
        refetchOnMount: false,
      },
      {
        queryKey: ['ledgerAccounts', 'Liabilities'],
        queryFn: () => getApiLedgerAccounts({ type: 'Liabilities' }),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
        refetchOnMount: false,
      },
    ],
  });

  // Destructure the results
  const [assetQuery, liabilityQuery] = results;

  // Combine data safely with useMemo
  const combinedData = useMemo((): string[] => {
    if (!assetQuery.data || !liabilityQuery.data) return [];
    return [...assetQuery.data, ...liabilityQuery.data];
  }, [assetQuery.data, liabilityQuery.data]);

  return {
    data: combinedData,
    isSuccess: assetQuery.isSuccess && liabilityQuery.isSuccess,
    isLoading: assetQuery.isLoading || liabilityQuery.isLoading,
    isError: assetQuery.isError || liabilityQuery.isError,
    error: assetQuery.error || liabilityQuery.error,
  };
}
