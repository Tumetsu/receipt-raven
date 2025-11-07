import { Control, FieldValues, Path } from 'react-hook-form';
import { Box, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import { ControlledDatePicker } from '../../../common/components/ControlledDatePicker.tsx';
import type { GetApiReceipts200ReceiptsItemOcrNotes } from '../../../api/generated/model/index.ts';

type ReceiptDatePickerProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  label?: string;
  helperText?: string;
  ocrNotes?: GetApiReceipts200ReceiptsItemOcrNotes;
};

export function ReceiptDatePicker<T extends FieldValues>(
  props: ReceiptDatePickerProps<T>
) {
  const { name, control, required, label, helperText, ocrNotes } = props;

  const dateIssue = ocrNotes?.suspiciousDate;
  const hasIssue = !!dateIssue;

  const getIconAndColor = () => {
    if (!dateIssue) return null;

    switch (dateIssue.level) {
      case 'ERROR':
      case 'SEVERE':
        return { icon: ErrorIcon, color: 'error.main' };
      case 'WARN':
        return { icon: WarningAmberIcon, color: 'warning.main' };
      default:
        return { icon: WarningAmberIcon, color: 'warning.main' };
    }
  };

  const iconConfig = getIconAndColor();

  return (
    <Stack spacing={0.5}>
      <ControlledDatePicker
        name={name}
        control={control}
        required={required}
        label={label}
        helperText={helperText}
      />
      {hasIssue && iconConfig && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
          }}
        >
          <iconConfig.icon
            sx={{
              fontSize: 16,
              color: iconConfig.color,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: iconConfig.color,
            }}
          >
            {dateIssue.message}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
