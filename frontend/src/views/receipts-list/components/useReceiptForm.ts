import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { z } from 'zod';
import {
  useGetApiReceiptsReceiptIdItems,
  usePostApiReceiptsReceiptId,
} from '../../../api/generated/api.ts';
import {
  GetApiReceipts200Item,
  GetApiReceipts200ItemStatus,
} from '../../../api/generated/model';

const receiptFormSchema = z
  .object({
    sourceAccount: z.string(),
    totalSum: z.coerce.number<number>(),
    description: z.string(),
    date: z.string(),
    payee: z.string(),
    items: z
      .array(
        z.object({
          id: z.number().optional(),
          name: z.string().min(1),
          price: z.coerce.number<number>(),
          expenseAccount: z.string(),
        })
      )
      .min(1),
  })
  .refine(
    data => {
      const itemsSum = data.items.reduce((sum, item) => sum + item.price, 0);
      return Math.abs(itemsSum - data.totalSum) < 0.01; // Allow for floating point precision
    },
    {
      message: 'Sum of items must equal total sum',
      path: ['items'],
    }
  );

export type IReceiptInputs = z.infer<typeof receiptFormSchema>;

export function useReceiptForm(
  receipt: GetApiReceipts200Item,
  onApprove: () => void
) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const {
    isPending: isItemsPending,
    isSuccess: isItemsSuccess,
    data: itemsResult,
  } = useGetApiReceiptsReceiptIdItems(receipt.id, {
    query: { queryKey: ['receipt', receipt.id, 'receiptItems'] },
  });

  const formMethods = useForm<IReceiptInputs>({
    resolver: zodResolver(receiptFormSchema),
    disabled: receipt.status === GetApiReceipts200ItemStatus.approved,
    values: {
      sourceAccount: receipt.sourceAccount ?? '',
      description: receipt.description ?? '',
      totalSum: receipt.totalSum,
      date: receipt.date,
      payee: receipt.payee,
      items: itemsResult ?? [],
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
          sourceAccount: data.sourceAccount,
          description: data.description ?? null,
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
          enqueueSnackbar(error.message ?? 'Error saving receipt', {
            variant: 'error',
          });
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
