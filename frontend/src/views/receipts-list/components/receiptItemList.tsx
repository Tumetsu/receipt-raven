import { Typography, IconButton, Card, Grid, Stack, Box } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { useGetApiLedgerAccounts } from '../../../api/generated/api';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import {
  ArrayPath,
  Control,
  FieldValues,
  Path,
  useFieldArray,
} from 'react-hook-form';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';

type ReceiptItemListProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TFieldArrayName;
  disabled: boolean;
};

export function ReceiptItemList<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
>({
  control,
  name,
  disabled,
}: ReceiptItemListProps<TFieldValues, TFieldArrayName>) {
  const expenseAccounts = useGetApiLedgerAccounts(
    {
      type: 'Expenses',
    },
    {
      query: { queryKey: ['ledgerAccounts', 'Expenses'] },
    }
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const onAddItem = () => {
    append({ name: '', price: '', category: '' } as never);
  };

  const onRemoveItem = (idx: number) => {
    remove(idx);
  };
  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <Typography variant="h4" sx={{ marginBottom: 2 }}>
          Products
        </Typography>
        <IconButton
          sx={{ position: 'absolute', right: 4, top: 0 }}
          onClick={onAddItem}
          disabled={disabled}
        >
          <AddIcon />
        </IconButton>
      </Box>
      {fields.map((field, idx) => (
        <Card
          variant="outlined"
          key={field.id}
          sx={{ position: 'relative', marginBottom: 2, padding: 2 }}
        >
          <IconButton
            sx={{ position: 'absolute', right: 4, top: 1 }}
            onClick={() => onRemoveItem(idx)}
            disabled={disabled}
          >
            <ClearIcon />
          </IconButton>
          <Grid container gap={2}>
            <Grid size={11}>
              <Stack direction="row" useFlexGap gap={2}>
                <ControlledTextField
                  name={`${name}.${idx}.name` as unknown as Path<TFieldValues>}
                  label="Product"
                  control={control}
                  required
                />
                <ControlledTextField
                  name={`${name}.${idx}.price` as unknown as Path<TFieldValues>}
                  label="Price"
                  control={control}
                  required
                />
              </Stack>
            </Grid>
            <Grid size={11}>
              {expenseAccounts.isSuccess && (
                <ControlledComboBox
                  name={
                    `${name}.${idx}.category` as unknown as Path<TFieldValues>
                  }
                  control={control}
                  options={expenseAccounts.data}
                  label="Expense category"
                  required
                />
              )}
            </Grid>
          </Grid>
        </Card>
      ))}
    </>
  );
}
