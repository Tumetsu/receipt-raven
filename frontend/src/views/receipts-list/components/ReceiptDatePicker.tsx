import { Control, FieldValues, Path, useWatch } from 'react-hook-form';
import { DateTime } from 'luxon';
import { Box, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ControlledDatePicker } from '../../../common/components/ControlledDatePicker.tsx';

type ReceiptDatePickerProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  label?: string;
  helperText?: string;
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

export function ReceiptDatePicker<T extends FieldValues>(
  props: ReceiptDatePickerProps<T>
) {
  const { name, control, required, label, helperText } = props;

  // Watch the field value to determine warning level
  const dateValue = useWatch({ control, name });
  const warningLevel = getDateWarningLevel(dateValue);
  const hasWarning = warningLevel !== 'none';

  return (
    <Stack spacing={0.5}>
      <ControlledDatePicker
        name={name}
        control={control}
        required={required}
        label={label}
        helperText={helperText}
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
}
