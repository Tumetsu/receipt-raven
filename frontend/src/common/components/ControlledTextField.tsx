import { TextField, TextFieldProps } from '@mui/material';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

type ControlledTextFieldProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
} & Omit<
  TextFieldProps,
  'name' | 'defaultValue' | 'onChange' | 'value' | 'ref'
>;

export function ControlledTextField<T extends FieldValues>(
  props: ControlledTextFieldProps<T>
) {
  const { name, control, required, ...textFieldProps } = props;

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...textFieldProps}
          sx={{ backgroundColor: 'white' }}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || textFieldProps.helperText}
          required
        />
      )}
    />
  );
}
