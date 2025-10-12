import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { z } from 'zod';
import {
  useGetApiReceiptsReceiptIdItems,
  usePostApiReceiptsReceiptId,
} from '../../../api/generated/api.ts';
import { Receipt } from '../../../api/generated/model';

const receiptFormSchema = z.object({
  expenseAccount: z.string(),
  totalSum: z.coerce.number<number>(),
  date: z.string(),
  payee: z.string(),
  items: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        price: z.coerce.number<number>(),
        category: z.string(),
      })
    )
    .min(1),
});

export type IReceiptInputs = z.infer<typeof receiptFormSchema>;

export function useReceiptForm(receipt: Receipt, onApprove: () => void) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const {
    isPending: isItemsPending,
    isSuccess: isItemsSuccess,
    data: itemsResult,
  } = useGetApiReceiptsReceiptIdItems(receipt.id.toString(10), {
    query: { queryKey: ['receipt', receipt.id, 'receiptItems'] },
  });

  const formMethods = useForm<IReceiptInputs>({
    resolver: zodResolver(receiptFormSchema),
    disabled: receipt.status === 'approved',
    values: {
      expenseAccount: receipt.expenseAccount ?? '',
      totalSum: receipt.totalSum,
      date: receipt.date,
      payee: receipt.payee,
      items: itemsResult?.data ?? [],
    },
  });

  const { mutate, isPending: isSavePending } = usePostApiReceiptsReceiptId({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['receipts'] });
        await queryClient.invalidateQueries({
          queryKey: ['receipt', receipt.id, 'receiptItems'],
        });
      },
    },
  });

  const onSubmit = (data: IReceiptInputs) => {
    mutate(
      {
        receiptId: receipt.id,
        data: {
          expenseAccount: data.expenseAccount,
          date: data.date,
          payee: data.payee,
          totalSum: data.totalSum,
          items: data.items,
        },
      },
      {
        onSuccess: async () => {
          formMethods.reset();
          enqueueSnackbar('Receipt approved', { variant: 'success' });
          onApprove();
        },
        onError: error => {
          enqueueSnackbar(
            error.response?.data.message ?? 'Error saving receipt',
            { variant: 'error' }
          );
        },
      }
    );
  };

  return {
    formMethods,
    onSubmit,
    isSavePending,
    isItemsPending,
    isItemsSuccess,
  };
}
