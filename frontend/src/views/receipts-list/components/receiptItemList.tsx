import { useState } from 'react';
import {
  Typography,
  IconButton,
  Box,
  Stack,
  styled,
  Button,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import MergeIcon from '@mui/icons-material/MergeType';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import {
  ArrayPath,
  Control,
  FieldValues,
  FieldArrayWithId,
  Path,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useWatch,
  UseFormSetValue,
} from 'react-hook-form';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';
import { useExpenseAccounts } from '../hooks/useExpenseAccounts.ts';
import { ActionType } from './receiptPanel.tsx';
import { AssignPriceDifferenceModal } from './AssignPriceDifferenceModal.tsx';

const ProductCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  position: 'relative',
  backgroundColor: theme.palette.grey[50],
}));

type ProductItemProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> = {
  field: FieldArrayWithId<TFieldValues, TFieldArrayName>;
  index: number;
  name: TFieldArrayName;
  control: Control<TFieldValues>;
  disabled: boolean;
  onRemove: (index: number) => void;
  expenseAccountOptions: string[];
  mergeMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  hasPriceMismatch: boolean;
  onAssign: (index: number) => void;
};

const ReceiptItemCardButtonContainer = styled(Box)(() => ({
  position: 'absolute',
  right: 4,
  top: 4,
  display: 'flex',
  flexDirection: 'column',
}));

const ReceiptItemCardButton = styled(IconButton)(() => ({
  height: `40px`,
}));

function ProductItem<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
>({
  field,
  index,
  name,
  control,
  disabled,
  onRemove,
  expenseAccountOptions,
  mergeMode,
  isSelected,
  onSelect,
  hasPriceMismatch,
  onAssign,
}: ProductItemProps<TFieldValues, TFieldArrayName>) {
  return (
    <ProductCard
      key={field.id}
      onClick={() => mergeMode && onSelect(field.id)}
      sx={{
        border: theme =>
          mergeMode && isSelected
            ? `2px solid ${theme.palette.secondary.main}`
            : `1px solid ${theme.palette.divider}`,
      }}
    >
      {!mergeMode && (
        <ReceiptItemCardButtonContainer>
          <ReceiptItemCardButton
            onClick={() => onRemove(index)}
            disabled={disabled}
          >
            <ClearIcon />
          </ReceiptItemCardButton>
          {hasPriceMismatch && (
            <ReceiptItemCardButton
              onClick={() => onAssign(index)}
              disabled={disabled}
              title="Assign price difference to this item"
              size="small"
            >
              <KeyboardReturnIcon fontSize="small" />
            </ReceiptItemCardButton>
          )}
        </ReceiptItemCardButtonContainer>
      )}
      <Box sx={{ paddingRight: 4, pointerEvents: mergeMode ? 'none' : 'auto' }}>
        <Stack gap={2}>
          <ControlledTextField
            name={`${name}.${index}.name` as unknown as Path<TFieldValues>}
            label="Product"
            control={control}
            required
            disabled={disabled || mergeMode}
            sx={{ flex: 1 }}
          />
          <ControlledComboBox
            name={
              `${name}.${index}.expenseAccount` as unknown as Path<TFieldValues>
            }
            control={control}
            options={expenseAccountOptions}
            label="Expense account"
            required
            disabled={disabled || mergeMode}
          />
          <ControlledTextField
            name={`${name}.${index}.price` as unknown as Path<TFieldValues>}
            label="Price"
            control={control}
            required
            disabled={disabled || mergeMode}
            sx={{ width: '100px' }}
          />
        </Stack>
      </Box>
    </ProductCard>
  );
}

type ReceiptItemListProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  fields: FieldArrayWithId<TFieldValues, TFieldArrayName>[];
  append: UseFieldArrayAppend<TFieldValues, TFieldArrayName>;
  remove: UseFieldArrayRemove;
  actionMode: ActionType;
  name: TFieldArrayName;
  disabled: boolean;
  onMergeActivate: () => void;
  selectedReceiptItems: Record<string, boolean>;
  onSelectItem: (id: string) => void;
  setValue: UseFormSetValue<TFieldValues>;
};

type NormalModeActionsProps = {
  onMergeActivate: () => void;
  onAddItem: () => void;
  disabled: boolean;
  hasMultipleFields: boolean;
};
const NormalModeActions = ({
  onMergeActivate,
  onAddItem,
  disabled,
  hasMultipleFields,
}: NormalModeActionsProps) => (
  <>
    <Button
      size="small"
      startIcon={<MergeIcon />}
      onClick={onMergeActivate}
      disabled={disabled || !hasMultipleFields}
      sx={{
        color: 'secondary.dark',
        fontWeight: 500,
        '&:hover': { backgroundColor: 'secondary.light' },
        '&.Mui-disabled': {
          color: 'grey.400',
        },
      }}
    >
      Merge
    </Button>
    <IconButton
      onClick={onAddItem}
      disabled={disabled}
      size="small"
      sx={{
        color: 'primary.main',
        '&:hover': { backgroundColor: 'primary.light' },
      }}
    >
      <AddIcon />
    </IconButton>
  </>
);

export function ReceiptItemList<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
>({
  control,
  fields,
  append,
  remove,
  actionMode,
  name,
  disabled,
  onMergeActivate,
  selectedReceiptItems,
  onSelectItem,
  setValue,
}: ReceiptItemListProps<TFieldValues, TFieldArrayName>) {
  const expenseAccounts = useExpenseAccounts();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetIndex, setAssignTargetIndex] = useState<number | null>(
    null
  );

  // Watch form values to calculate price difference
  const items = useWatch({ control, name: name as Path<TFieldValues> }) as
    | Array<{ price: number; name: string }>
    | undefined;
  const totalSum = useWatch({
    control,
    name: 'totalSum' as Path<TFieldValues>,
  }) as number | undefined;

  // Calculate price difference
  const itemsSum = Array.isArray(items)
    ? items.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    : 0;
  const totalSumNumber = Number(totalSum) || 0;
  const hasPriceMismatch = Math.abs(itemsSum - totalSumNumber) >= 0.01;
  const priceDifference = totalSumNumber - itemsSum;

  const onAddItem = () => {
    append({ name: '', price: '', expenseAccount: '' } as never);
  };

  const onRemoveItem = (idx: number) => {
    remove(idx);
  };

  const onAssignClick = (index: number) => {
    setAssignTargetIndex(index);
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = () => {
    if (assignTargetIndex !== null && items && items[assignTargetIndex]) {
      const currentItem = items[assignTargetIndex];
      const currentPrice = Number(currentItem.price) || 0;
      const newPrice = currentPrice + priceDifference;

      // Update the price of the target item
      setValue(
        `${name}.${assignTargetIndex}.price` as Path<TFieldValues>,
        newPrice as never,
        { shouldValidate: true, shouldDirty: true }
      );
    }

    setAssignModalOpen(false);
    setAssignTargetIndex(null);
  };

  const handleAssignCancel = () => {
    setAssignModalOpen(false);
    setAssignTargetIndex(null);
  };

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Products
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {actionMode !== 'merge' && (
            <NormalModeActions
              onMergeActivate={onMergeActivate}
              onAddItem={onAddItem}
              disabled={disabled}
              hasMultipleFields={fields.length > 1}
            />
          )}
        </Box>
      </Box>
      {expenseAccounts.isSuccess &&
        fields.map((field, idx) => (
          <ProductItem
            key={field.id}
            field={field}
            index={idx}
            name={name}
            control={control}
            disabled={disabled}
            onRemove={onRemoveItem}
            expenseAccountOptions={expenseAccounts.data}
            mergeMode={actionMode === 'merge'}
            isSelected={selectedReceiptItems[field.id]}
            onSelect={onSelectItem}
            hasPriceMismatch={hasPriceMismatch}
            onAssign={onAssignClick}
          />
        ))}

      {assignTargetIndex !== null && items && items[assignTargetIndex] && (
        <AssignPriceDifferenceModal
          open={assignModalOpen}
          onClose={handleAssignCancel}
          onConfirm={handleAssignConfirm}
          itemName={items[assignTargetIndex].name}
          currentPrice={Number(items[assignTargetIndex].price) || 0}
          difference={priceDifference}
        />
      )}
    </>
  );
}
