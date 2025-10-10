import { Autocomplete, TextField } from '@mui/material';
import { SxProps, Theme } from '@mui/system';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

export type ComboBoxProps = {
  options: string[];
  label: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  required?: boolean;
  sx?: SxProps<Theme>;
};

export function ComboBox({
  options,
  label,
  value,
  onChange,
  required,
  sx,
}: ComboBoxProps) {
  return (
    <Autocomplete
      disablePortal
      options={options}
      sx={sx}
      value={value || null}
      onChange={(_, newValue) => onChange?.(newValue)}
      renderInput={params => (
        <TextField {...params} label={label} required={required} />
      )}
    />
  );
}

type ControlledComboBoxProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
} & Omit<ComboBoxProps, 'value' | 'onChange'>;

export function ControlledComboBox<T extends FieldValues>({
  name,
  control,
  required,
  ...comboBoxProps
}: ControlledComboBoxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field, fieldState }) => (
        <ComboBox
          {...comboBoxProps}
          value={field.value ?? null}
          onChange={field.onChange}
          required={required}
          sx={{
            ...comboBoxProps.sx,
            '& .MuiInputBase-root': {
              borderColor: fieldState.error ? 'error.main' : undefined,
            },
          }}
        />
      )}
    />
  );
}
