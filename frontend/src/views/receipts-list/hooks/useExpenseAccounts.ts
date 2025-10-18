import { useGetApiLedgerAccounts } from '../../../api/generated/api.ts';

export function useExpenseAccounts() {
  return useGetApiLedgerAccounts(
    { type: 'Expenses' },
    {
      query: {
        queryKey: ['ledgerAccounts', 'Expenses'],
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
        refetchOnMount: false,
      },
    }
  );
}
