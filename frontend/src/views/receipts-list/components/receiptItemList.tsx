import { Typography, IconButton, Box, styled } from '@mui/material';
import { grey } from '@mui/material/colors';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import {
  ArrayPath,
  Control,
  FieldValues,
  Path,
  useFieldArray,
} from 'react-hook-form';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';
import { useExpenseAccounts } from '../hooks/useExpenseAccounts.ts';
import { ReactElement } from 'react';

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

type ReceiptItemListProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TFieldArrayName;
  disabled: boolean;
};

function getIconButton(icon: ReactElement) {
  return function IconButtonComponent({
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
        {icon}
      </IconButton>
    );
  };
}

const AddItemButton = getIconButton(<AddIcon />);
const RemoveItemButton = getIconButton(<ClearIcon />);

export function ReceiptItemList<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
>({
  control,
  name,
  disabled,
}: ReceiptItemListProps<TFieldValues, TFieldArrayName>) {
  const expenseAccounts = useExpenseAccounts();

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const onAddItem = () => {
    append({ name: '', price: '', expenseAccount: '' } as never);
  };

  const onRemoveItem = (idx: number) => {
    remove(idx);
  };
  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 500 }}>
          Products
        </Typography>
        <AddItemButton onClick={onAddItem} disabled={disabled} />
      </Box>
      {fields.map((field, idx) => (
        <ProductCard key={field.id}>
          <RemoveItemButton
            onClick={() => onRemoveItem(idx)}
            disabled={disabled}
          />
          <Box sx={{ paddingRight: 4 }}>
            <ProductHeader>
              <ControlledTextField
                name={`${name}.${idx}.name` as unknown as Path<TFieldValues>}
                label="Product"
                control={control}
                required
                disabled={disabled}
                sx={{ flex: 1 }}
              />
              <ControlledTextField
                name={`${name}.${idx}.price` as unknown as Path<TFieldValues>}
                label="Price"
                control={control}
                required
                disabled={disabled}
                sx={{ width: '100px' }}
              />
            </ProductHeader>
            {expenseAccounts.isSuccess && (
              <ControlledComboBox
                name={
                  `${name}.${idx}.expenseAccount` as unknown as Path<TFieldValues>
                }
                control={control}
                options={expenseAccounts.data}
                label="Expense account"
                required
                disabled={disabled}
              />
            )}
          </Box>
        </ProductCard>
      ))}
    </>
  );
}
