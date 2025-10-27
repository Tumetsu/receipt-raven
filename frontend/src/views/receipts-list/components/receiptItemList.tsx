import { Typography, IconButton, Box, styled, Button } from '@mui/material';
import { blue, grey, purple } from '@mui/material/colors';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import MergeIcon from '@mui/icons-material/MergeType';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import {
  ArrayPath,
  Control,
  FieldValues,
  FieldArrayWithId,
  Path,
  useFieldArray,
} from 'react-hook-form';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';
import { useExpenseAccounts } from '../hooks/useExpenseAccounts.ts';
import { useMergeReceiptItems } from '../hooks/useMergeReceiptItems.ts';

const ProductCard = styled(Box)(({ theme }) => ({
  border: '1px solid #e5e7eb',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  position: 'relative',
  backgroundColor: grey[50],
}));

const ProductHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),
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
};

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
}: ProductItemProps<TFieldValues, TFieldArrayName>) {
  return (
    <ProductCard
      key={field.id}
      onClick={() => mergeMode && onSelect(field.id)}
      sx={{
        border:
          mergeMode && isSelected
            ? `2px solid ${purple[500]}`
            : '1px solid #e5e7eb',
      }}
    >
      {!mergeMode && (
        <RemoveItemButton onClick={() => onRemove(index)} disabled={disabled} />
      )}
      <Box sx={{ paddingRight: 4, pointerEvents: mergeMode ? 'none' : 'auto' }}>
        <ProductHeader>
          <ControlledTextField
            name={`${name}.${index}.name` as unknown as Path<TFieldValues>}
            label="Product"
            control={control}
            required
            disabled={disabled || mergeMode}
            sx={{ flex: 1 }}
          />
          <ControlledTextField
            name={`${name}.${index}.price` as unknown as Path<TFieldValues>}
            label="Price"
            control={control}
            required
            disabled={disabled || mergeMode}
            sx={{ width: '100px' }}
          />
        </ProductHeader>
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
      </Box>
    </ProductCard>
  );
}

type ReceiptItemListProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TFieldArrayName;
  disabled: boolean;
  onMergeStateChange?: (isMerging: boolean) => void;
};

function RemoveItemButton({
  onClick,
  disabled,
}: {
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <IconButton
      sx={{ position: 'absolute', right: 4, top: 0 }}
      onClick={onClick}
      disabled={disabled}
    >
      <ClearIcon />
    </IconButton>
  );
}

type NormalModeActionsProps = {
  onToggleMergeMode: () => void;
  onAddItem: () => void;
  disabled: boolean;
  hasMultipleFields: boolean;
};
const NormalModeActions = ({
  onToggleMergeMode,
  onAddItem,
  disabled,
  hasMultipleFields,
}: NormalModeActionsProps) => (
  <>
    <Button
      size="small"
      startIcon={<MergeIcon />}
      onClick={onToggleMergeMode}
      disabled={disabled || !hasMultipleFields}
      sx={{
        color: purple[600],
        fontWeight: 500,
        '&:hover': { backgroundColor: purple[50] },
        '&.Mui-disabled': {
          color: grey[400],
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
        color: blue[600],
        '&:hover': { backgroundColor: blue[50] },
      }}
    >
      <AddIcon />
    </IconButton>
  </>
);

type MergeModeActionsProps = {
  onCancel: () => void;
  onMerge: () => void;
  mergeAllowed: boolean;
  disabled: boolean;
};
const MergeModeActions = ({
  onCancel,
  onMerge,
  mergeAllowed,
  disabled,
}: MergeModeActionsProps) => (
  <>
    <Button
      size="small"
      startIcon={<MergeIcon />}
      onClick={onMerge}
      disabled={disabled || !mergeAllowed}
      sx={{
        color: purple[600],
        fontWeight: 500,
        '&:hover': { backgroundColor: purple[50] },
        '&.Mui-disabled': {
          color: grey[400],
        },
      }}
    >
      Merge selected
    </Button>
    <Button
      size="small"
      startIcon={<ClearIcon />}
      onClick={onCancel}
      disabled={disabled}
      sx={{
        color: grey[600],
        fontWeight: 500,
        '&:hover': { backgroundColor: grey[50] },
        '&.Mui-disabled': {
          color: grey[400],
        },
      }}
    >
      Cancel
    </Button>
  </>
);

export function ReceiptItemList<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
>({
  control,
  name,
  disabled,
  onMergeStateChange,
}: ReceiptItemListProps<TFieldValues, TFieldArrayName>) {
  const expenseAccounts = useExpenseAccounts();

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name,
  });

  const {
    mergeMode,
    setMergeMode,
    selectedReceiptItems,
    onSelectItem,
    onMergeItems,
    resetMerge,
    isMergeAllowed,
  } = useMergeReceiptItems({
    fields,
    replace,
    onMergeStateChange,
  });

  const onAddItem = () => {
    append({ name: '', price: '', expenseAccount: '' } as never);
  };

  const onRemoveItem = (idx: number) => {
    remove(idx);
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
          {mergeMode ? (
            <MergeModeActions
              mergeAllowed={isMergeAllowed}
              onMerge={onMergeItems}
              onCancel={() => resetMerge()}
              disabled={disabled}
            />
          ) : (
            <NormalModeActions
              onToggleMergeMode={() => setMergeMode(true)}
              onAddItem={onAddItem}
              disabled={disabled}
              hasMultipleFields={true}
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
            mergeMode={mergeMode}
            isSelected={selectedReceiptItems[field.id]}
            onSelect={onSelectItem}
          />
        ))}
    </>
  );
}
