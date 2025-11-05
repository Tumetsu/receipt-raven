import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { DateTime } from 'luxon';

type ControlledDatePickerProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  label?: string;
  helperText?: string;
};

export function ControlledDatePicker<T extends FieldValues>(
  props: ControlledDatePickerProps<T>
) {
  const { name, control, required, label, helperText } = props;

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field, fieldState }) => (
        <DatePicker
          label={label}
          value={field.value ? DateTime.fromISO(field.value) : null}
          onChange={(date: DateTime | null) => {
            // Convert Luxon DateTime to ISO string for form storage
            field.onChange(date?.toISODate() ?? '');
          }}
          slotProps={{
            textField: {
              error: !!fieldState.error,
              helperText: fieldState.error?.message || helperText,
              required,
              sx: { backgroundColor: 'white' },
              onBlur: field.onBlur,
              name: field.name,
            },
          }}
        />
      )}
    />
  );
}
