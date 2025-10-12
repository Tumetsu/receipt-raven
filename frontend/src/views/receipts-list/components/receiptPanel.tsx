import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Control } from 'react-hook-form';
import { useModal } from '../hooks/useModal';
import { ReceiptImageModal } from './receiptImageModal.tsx';
import { Img } from '../../../common/components/Img.tsx';
import { Receipt } from '../../../api/generated/model/receipt.ts';
import { ReceiptItemList } from './receiptItemList.tsx';
import { useAccounts } from '../hooks/useGetAccounts.ts';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';
import { useReceiptForm, IReceiptInputs } from './useReceiptForm.ts';

interface ReceiptHeaderProps {
  control: Control<IReceiptInputs>;
}

function ReceiptHeader({ control }: ReceiptHeaderProps) {
  const accounts = useAccounts();

  return (
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
  );
}

interface ReceiptDetailsFormProps {
  control: Control<IReceiptInputs>;
}

function ReceiptDetailsForm({ control }: ReceiptDetailsFormProps) {
  return (
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
    </Stack>
  );
}

interface ReceiptImageProps {
  filepath: string;
}

function ReceiptImage({ filepath }: ReceiptImageProps) {
  const imgModal = useModal();

  return (
    <>
      <Img
        sx={{
          height: '20',
          width: {
            xs: '100%',
            lg: '50%',
          },
        }}
        src={filepath}
        alt="Receipt"
        onClick={imgModal.openModal}
      />
      <ReceiptImageModal
        open={imgModal.isOpen}
        onClose={imgModal.onModalClose}
        imagePath={filepath}
      />
    </>
  );
}

interface ReceiptActionsProps {
  isSavePending: boolean;
  isApproved: boolean;
}

function ReceiptActions({ isSavePending, isApproved }: ReceiptActionsProps) {
  return (
    <Stack spacing={2} direction="row" useFlexGap>
      <Button
        fullWidth
        variant="contained"
        type="submit"
        disabled={isSavePending || isApproved}
      >
        Approve
      </Button>
      <Button
        fullWidth
        variant="outlined"
        disabled={isSavePending || isApproved}
      >
        Delete
      </Button>
    </Stack>
  );
}

interface ReceiptPanelProps {
  receipt: Receipt;
  onApprove: () => void;
}

function ReceiptPanel({ receipt, onApprove }: ReceiptPanelProps) {
  const {
    formMethods,
    onSubmit,
    isSavePending,
    isItemsPending,
    isItemsSuccess,
  } = useReceiptForm(receipt, onApprove);

  const { handleSubmit, control } = formMethods;
  const isApproved = receipt.status === 'approved';

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ p: 2 }}>
          <Grid container spacing={4}>
            <Grid size={12}>
              <ReceiptHeader control={control} />
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
                  <ReceiptDetailsForm control={control} />
                  <ReceiptActions
                    isSavePending={isSavePending}
                    isApproved={isApproved}
                  />
                </Stack>
                <ReceiptImage filepath={receipt.filepath} />
              </Stack>
            </Grid>

            <Grid size={12}>
              {isItemsPending && (
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
              {isItemsSuccess && (
                <ReceiptItemList
                  name="items"
                  control={control}
                  disabled={isApproved}
                />
              )}
            </Grid>
          </Grid>
        </Card>
      </form>
    </Box>
  );
}

export default ReceiptPanel;
