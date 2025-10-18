import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Control, useWatch } from 'react-hook-form';
import { useRef, useState } from 'react';
import { Receipt } from '../../../api/generated/model/receipt.ts';
import { ReceiptItemList } from './receiptItemList.tsx';
import { useAccounts } from '../hooks/useGetAccounts.ts';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';
import { useReceiptForm, IReceiptInputs } from './useReceiptForm.ts';
import {
  Panel,
  PanelContent,
  PanelRef,
} from '../../../common/components/Panel.tsx';
import { DeleteDialog } from '../../../common/components/DeleteDialog.tsx';
import { useDeleteApiReceiptsReceiptId } from '../../../api/generated/api.ts';
import { useQueryClient } from '@tanstack/react-query';
import { ReceiptImage } from '../../../common/components/receipt-image/ReceiptImage.tsx';

const PanelFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  paddingBottom: `calc(${theme.spacing(2)} + env(safe-area-inset-bottom, 0px))`,
  borderTop: '1px solid #e5e7eb',
  flexShrink: 0,
  backgroundColor: '#ffffff',
}));

interface ReceiptHeaderProps {
  control: Control<IReceiptInputs>;
}

function ReceiptFormHeader({ control }: ReceiptHeaderProps) {
  const accounts = useAccounts();

  return (
    <Stack spacing={2} useFlexGap>
      {accounts.isSuccess && (
        <ControlledComboBox
          name="sourceAccount"
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

interface SumComparisonProps {
  control: Control<IReceiptInputs>;
}

function SumComparison({ control }: SumComparisonProps) {
  const items = useWatch({ control, name: 'items' });
  const totalSum = useWatch({ control, name: 'totalSum' });

  const itemsSum = Array.isArray(items)
    ? items.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    : 0;
  const totalSumNumber = Number(totalSum) || 0;
  const isMatch = Math.abs(itemsSum - totalSumNumber) < 0.01;

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      {!isMatch && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" color="text.secondary">
            Expected total:
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {totalSumNumber.toFixed(2)} €
          </Typography>
        </Stack>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Items sum:
        </Typography>
        <Typography
          variant="body1"
          fontWeight={500}
          sx={{ color: isMatch ? 'text.primary' : 'error.main' }}
        >
          {itemsSum.toFixed(2)} €
        </Typography>
      </Stack>
    </Stack>
  );
}

interface ReceiptActionsProps {
  isSavePending: boolean;
  isApproved: boolean;
  isInvalid: boolean;
}

function ReceiptActions({
  isSavePending,
  isApproved,
  isInvalid,
}: ReceiptActionsProps) {
  return (
    <Stack spacing={2} direction="row" useFlexGap>
      <Button
        fullWidth
        variant="contained"
        type="submit"
        disabled={isSavePending || isApproved || isInvalid}
      >
        Approve
      </Button>
    </Stack>
  );
}

interface ReceiptPanelProps {
  receipt: Receipt;
  onApprove: () => void;
  onClosePanel: () => void;
}

function ReceiptPanelContent({
  receipt,
  onApprove,
}: Omit<ReceiptPanelProps, 'onClosePanel'>) {
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      <PanelContent>
        <Stack spacing={3}>
          {/* Receipt Image */}
          <Box>
            <ReceiptImage url={receipt.fileUrl} />
          </Box>

          {/* Receipt Information */}
          <ReceiptFormHeader control={control} />
          <ReceiptDetailsForm control={control} />

          {/* Products/Items */}
          {isItemsPending && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}
          {isItemsSuccess && (
            <Box>
              <ReceiptItemList
                name="items"
                control={control}
                disabled={isApproved}
              />
            </Box>
          )}
        </Stack>
      </PanelContent>

      <PanelFooter>
        <SumComparison control={control} />
        <ReceiptActions
          isSavePending={isSavePending}
          isApproved={isApproved}
          isInvalid={!formMethods.formState.isValid}
        />
      </PanelFooter>
    </form>
  );
}

export function ReceiptPanel(props: ReceiptPanelProps) {
  const panelRef = useRef<PanelRef>(null);
  const deleteMutation = useDeleteApiReceiptsReceiptId();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleApprove = () => {
    panelRef.current?.close(props.onApprove);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    setIsDeleteDialogOpen(false);
    deleteMutation.mutate(
      { receiptId: props.receipt.id.toString(10) },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ['receipts'] });
          panelRef.current?.close(props.onClosePanel);
        },
      }
    );
  };

  return (
    <>
      <Panel
        ref={panelRef}
        title="Receipt Details"
        onClose={props.onClosePanel}
        renderHeaderActions={
          props.receipt.status !== 'approved' && (
            <IconButton onClick={handleDeleteClick} size="small">
              <DeleteIcon />
            </IconButton>
          )
        }
      >
        <ReceiptPanelContent
          receipt={props.receipt}
          onApprove={handleApprove}
        />
      </Panel>

      <DeleteDialog
        open={isDeleteDialogOpen}
        title="Delete Receipt"
        message="Are you sure you want to delete this receipt? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
