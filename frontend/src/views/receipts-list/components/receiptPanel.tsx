import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { GetApiReceipts200Item } from '../../../api/generated/model';
import { useModal } from '../hooks/useModal';
import { ReceiptImageModal } from './receiptImageModal.tsx';
import { Img } from '../../../common/components/Img.tsx';
import { useGetApiReceiptsReceiptIdItems } from '../../../api/generated/api.ts';
import { ReceiptItemList } from './receiptItemList.tsx';
import { useAccounts } from '../hooks/useGetAccounts.ts';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import { SubmitHandler, useForm } from 'react-hook-form';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';

interface IReceiptInputs {
  account: string;
  totalSum: number;
  date: string;
  payee: string;
}

function ReceiptPanel(props: { receipt: GetApiReceipts200Item }) {
  const { receipt } = props;
  const imgModal = useModal();
  const { handleSubmit, control } = useForm<IReceiptInputs>({
    defaultValues: {
      account: '',
      totalSum: receipt.totalSum,
      date: receipt.date,
      payee: receipt.payeeName,
    },
  });
  // TODO: handle form submit
  const onSubmit: SubmitHandler<IReceiptInputs> = data => console.log(data);

  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiReceiptsReceiptIdItems(receipt.id.toString(10));

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
                    name="account"
                    control={control}
                    options={accounts.data}
                    label="Account"
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
              {isSuccess && <ReceiptItemList items={result.data} />}
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
