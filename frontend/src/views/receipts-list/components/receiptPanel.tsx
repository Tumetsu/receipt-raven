import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { useRef, useState } from 'react';
import { ReceiptItemList } from './receiptItemList.tsx';
import { useAccounts } from '../hooks/useGetAccounts.ts';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';
import { ControlledDatePicker } from '../../../common/components/ControlledDatePicker.tsx';
import { useReceiptForm, IReceiptInputs } from './useReceiptForm.ts';
import {
  Panel,
  PanelContent,
  PanelRef,
} from '../../../common/components/Panel.tsx';
import { DeleteDialog } from '../../../common/components/DeleteDialog.tsx';
import {
  useDeleteApiReceiptsReceiptId,
  useGetApiReceiptsReceiptIdItems,
} from '../../../api/generated/api.ts';
import { useQueryClient } from '@tanstack/react-query';
import { ReceiptImage } from '../../../common/components/receipt-image/ReceiptImage.tsx';
import {
  GetApiReceipts200ReceiptsItem,
  GetApiReceipts200ReceiptsItemStatus,
} from '../../../api/generated/model';
import { PanelFooter } from './PanelFooter.tsx';
import { useMergeReceiptItems } from '../hooks/useMergeReceiptItems.ts';
import { ReadonlyReceiptView } from './ReadonlyReceiptView.tsx';
import { formatCurrency } from '../../../common/utils.ts';

export type ActionType = 'save' | 'approve' | 'merge';

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
        name="description"
        control={control}
        label="Description"
      />
      <ControlledTextField
        name="payee"
        control={control}
        label="Payee"
        required
      />
      <ControlledDatePicker
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
            {formatCurrency(totalSumNumber)}
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

export type Receipt = Omit<GetApiReceipts200ReceiptsItem, 'id'> & {
  id: number | null;
};
interface ReceiptPanelProps {
  receipt: Receipt;
  onApprove: () => void;
  onClosePanel: () => void;
}

function ReceiptPanelContent({
  receipt,
  onApprove,
}: Omit<ReceiptPanelProps, 'onClosePanel'>) {
  const isApproved =
    receipt.status === GetApiReceipts200ReceiptsItemStatus.approved;

  if (isApproved) {
    return <ReadonlyReceiptContent receipt={receipt} />;
  }

  return <EditableReceiptContent receipt={receipt} onApprove={onApprove} />;
}

function ReadonlyReceiptContent({ receipt }: { receipt: Receipt }) {
  const {
    isPending: isItemsPending,
    isSuccess: isItemsSuccess,
    data: items,
  } = useGetApiReceiptsReceiptIdItems(receipt.id ?? 0, {
    query: {
      queryKey: ['receipt', receipt.id, 'receiptItems'],
      enabled: receipt.id != null,
    },
  });

  return (
    <PanelContent>
      {isItemsPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {isItemsSuccess && (
        <ReadonlyReceiptView receipt={receipt} items={items ?? []} />
      )}
    </PanelContent>
  );
}

function EditableReceiptContent({
  receipt,
  onApprove,
}: Omit<ReceiptPanelProps, 'onClosePanel'>) {
  const [actionMode, setActionMode] = useState<ActionType>(
    receipt.id ? 'approve' : 'save'
  );

  const {
    formMethods,
    onSubmit,
    isSavePending,
    isItemsPending,
    isItemsSuccess,
  } = useReceiptForm(receipt, onApprove);

  const { handleSubmit, control, formState } = formMethods;
  const { isValid } = formState;

  const isApproveDisabled = isSavePending || !isValid;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  });

  const {
    selectedReceiptItems,
    onSelectItem,
    mergeItems,
    resetMerge,
    isMergeAllowed,
  } = useMergeReceiptItems({
    fields,
    replace,
    getValues: formMethods.getValues,
    name: 'items',
  });

  function onActionSuccess() {
    if (actionMode === 'merge') {
      mergeItems();
    }
    setActionMode(receipt.id ? 'approve' : 'save');
  }

  function onActionCancel() {
    if (actionMode === 'merge') {
      resetMerge();
      setActionMode(receipt.id ? 'approve' : 'save');
    }
  }

  function isActionDisabled() {
    if (actionMode === 'approve' || actionMode === 'save') {
      return isApproveDisabled;
    }
    if (actionMode === 'merge') {
      return !isMergeAllowed;
    }
    return false;
  }

  // Otherwise, show editable form
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
          {receipt.fileUrl && (
            <Box>
              <ReceiptImage url={receipt.fileUrl} />
            </Box>
          )}

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
                fields={fields}
                append={append}
                remove={remove}
                selectedReceiptItems={selectedReceiptItems}
                onSelectItem={onSelectItem}
                actionMode={actionMode}
                control={control}
                disabled={false}
                onMergeActivate={() => setActionMode('merge')}
              />
            </Box>
          )}
        </Stack>
      </PanelContent>

      <PanelFooter
        actionType={actionMode}
        isActionDisabled={isActionDisabled()}
        onSuccess={onActionSuccess}
        onCancel={onActionCancel}
        actionStatusComponent={
          actionMode !== 'merge' && <SumComparison control={control} />
        }
      />
    </form>
  );
}

export function ReceiptPanel({
  receipt,
  onApprove,
  onClosePanel,
}: ReceiptPanelProps) {
  const panelRef = useRef<PanelRef>(null);
  const deleteMutation = useDeleteApiReceiptsReceiptId();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleApprove = () => {
    panelRef.current?.close(onApprove);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    setIsDeleteDialogOpen(false);
    if (receipt.id) {
      deleteMutation.mutate(
        { receiptId: receipt.id },
        {
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['receipts'] });
            panelRef.current?.close(onClosePanel);
          },
        }
      );
    }
  };

  return (
    <>
      <Panel
        ref={panelRef}
        title="Receipt Details"
        onClose={onClosePanel}
        renderHeaderActions={
          receipt.status !== GetApiReceipts200ReceiptsItemStatus.approved &&
          receipt.id && (
            <IconButton onClick={handleDeleteClick} size="small">
              <DeleteIcon />
            </IconButton>
          )
        }
      >
        <ReceiptPanelContent receipt={receipt} onApprove={handleApprove} />
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
