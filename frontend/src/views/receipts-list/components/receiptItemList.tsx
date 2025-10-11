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
};

export function ReceiptItemList<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
>({ control, name }: ReceiptItemListProps<TFieldValues, TFieldArrayName>) {
  const expenseAccounts = useGetApiLedgerAccounts({
    type: 'Expenses',
  });

  const { fields } = useFieldArray({
    control,
    name,
  });

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <Typography variant="h4" sx={{ marginBottom: 2 }}>
          Products
        </Typography>
        <IconButton sx={{ position: 'absolute', right: 4, top: 1 }}>
          <AddIcon />
        </IconButton>
      </Box>
      {fields.map((field, idx) => (
        <Card
          variant="outlined"
          key={field.id}
          sx={{ position: 'relative', marginBottom: 2, padding: 2 }}
        >
          <IconButton sx={{ position: 'absolute', right: 4, top: 1 }}>
            <ClearIcon />
          </IconButton>
          <Grid container gap={2}>
            <Grid size={11}>
              <Stack direction="row" useFlexGap gap={2}>
                <ControlledTextField
                  name={`${name}.${idx}.name` as unknown as Path<TFieldValues>}
                  label="Product"
                  control={control}
                />
                <ControlledTextField
                  name={`${name}.${idx}.price` as unknown as Path<TFieldValues>}
                  label="Price"
                  control={control}
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
                  options={expenseAccounts.data.data}
                  label="Expense category"
                />
              )}
            </Grid>
          </Grid>
        </Card>
      ))}
    </>
  );
}
