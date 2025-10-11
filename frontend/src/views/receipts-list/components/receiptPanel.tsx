import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useModal } from '../hooks/useModal';
import { ReceiptImageModal } from './receiptImageModal.tsx';
import { Img } from '../../../common/components/Img.tsx';
import {
  useGetApiReceiptsReceiptIdItems,
  usePostApiReceiptsReceiptId,
} from '../../../api/generated/api.ts';
import { Receipt } from '../../../api/generated/model/receipt.ts';
import { ReceiptItemList } from './receiptItemList.tsx';
import { useAccounts } from '../hooks/useGetAccounts.ts';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import { SubmitHandler, useForm } from 'react-hook-form';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';

const receiptFormSchema = z.object({
  expenseAccount: z.string(),
  totalSum: z.coerce.number<number>(),
  date: z.string(),
  payee: z.string(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.coerce.number<number>(),
        category: z.string(),
      })
    )
    .min(1),
});
type IReceiptInputs = z.infer<typeof receiptFormSchema>;

function ReceiptPanel({ receipt }: { receipt: Receipt }) {
  const imgModal = useModal();
  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiReceiptsReceiptIdItems(receipt.id.toString(10));

  const { handleSubmit, control } = useForm<IReceiptInputs>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      expenseAccount: receipt.expenseAccount,
      totalSum: receipt.totalSum,
      date: receipt.date,
      payee: receipt.payee,
      items: result?.data ?? [],
    },
    values: {
      expenseAccount: receipt.expenseAccount ?? '',
      totalSum: receipt.totalSum,
      date: receipt.date,
      payee: receipt.payee,
      items: result?.data ?? [],
    },
  });

  const { mutate } = usePostApiReceiptsReceiptId();

  const onSubmit: SubmitHandler<IReceiptInputs> = data => {
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
        onSuccess: response => {
          console.log('Receipt saved', response);
        },
        onError: error => {
          console.error('Error saving receipt', error);
        },
      }
    );
  };

  const accounts = useAccounts();
  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ p: 2 }}>
          <Grid container spacing={4}>
            <Grid size={12}>
              <Stack spacing={2} useFlexGap>
                <Typography variant="h4">Receipt details</Typography>
                {accounts.isSuccess && (
                  <ControlledComboBox
                    name="expenseAccount"
                    control={control}
                    options={accounts.data}
                    label="Expense account"
                    required
                  />
                )}
              </Stack>
            </Grid>
            <Grid size={12}>
              <Stack
                spacing={2}
                useFlexGap
                direction={{
                  xs: 'column-reverse',
                  lg: 'row',
                }}
              >
                <Stack spacing={2} useFlexGap>
                  <ControlledTextField
                    name="payee"
                    control={control}
                    label="Payee"
                    required
                  />
                  <ControlledTextField
                    name="date"
                    control={control}
                    label="Date"
                    required
                  />
                  <ControlledTextField
                    name="totalSum"
                    control={control}
                    label="Total sum"
                    required
                  />
                  <Stack spacing={2} direction="row" useFlexGap>
                    <Button fullWidth variant="contained" type="submit">
                      Approve
                    </Button>
                    <Button fullWidth variant="outlined">
                      Delete
                    </Button>
                  </Stack>
                </Stack>
                <Img
                  sx={{
                    height: '20',
                    width: {
                      xs: '100%',
                      lg: '50%',
                    },
                  }}
                  src={receipt.filepath}
                  alt="Receipt"
                  onClick={imgModal.openModal}
                />
              </Stack>
            </Grid>
            <Grid size={12}>
              {isPending && (
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              {isSuccess && <ReceiptItemList name="items" control={control} />}
            </Grid>
          </Grid>
        </Card>
        <ReceiptImageModal
          open={imgModal.isOpen}
          onClose={imgModal.onModalClose}
          imagePath={receipt.filepath}
        />
      </form>
    </Box>
  );
}

export default ReceiptPanel;
