import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { DateTime } from 'luxon';
import { Box, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

type ControlledDatePickerProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  label?: string;
  helperText?: string;
  showDateWarnings?: boolean;
};

type DateWarningLevel = 'none' | 'warning' | 'error';

function getDateWarningLevel(dateString: string): DateWarningLevel {
  if (!dateString) return 'none';

  const selectedDate = DateTime.fromISO(dateString);
  const today = DateTime.now();

  if (!selectedDate.isValid) return 'none';

  // Check if date is in a different month or year
  const isDifferentMonth = selectedDate.month !== today.month;
  const isDifferentYear = selectedDate.year !== today.year;

  if (isDifferentMonth || isDifferentYear) {
    return 'error';
  }

  // Check if date is not today
  if (!selectedDate.hasSame(today, 'day')) {
    return 'warning';
  }

  return 'none';
}

export function ControlledDatePicker<T extends FieldValues>(
  props: ControlledDatePickerProps<T>
) {
  const { name, control, required, label, helperText, showDateWarnings = false } = props;

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field, fieldState }) => {
        const warningLevel = showDateWarnings ? getDateWarningLevel(field.value) : 'none';
        const hasWarning = warningLevel !== 'none';

        return (
          <Stack spacing={0.5}>
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
            {hasWarning && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                }}
              >
                <WarningAmberIcon
                  sx={{
                    fontSize: 16,
                    color: warningLevel === 'error' ? 'error.main' : 'warning.main',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: warningLevel === 'error' ? 'error.main' : 'warning.main',
                  }}
                >
                  Suspicious date
                </Typography>
              </Box>
            )}
          </Stack>
        );
      }}
    />
  );
}
