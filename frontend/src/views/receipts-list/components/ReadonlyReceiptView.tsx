import { Box, Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import { DisplayField } from '../../../common/components/DisplayField.tsx';
import { ReadonlyReceiptItems } from './ReadonlyReceiptItems.tsx';
import { ReceiptImage } from '../../../common/components/receipt-image/ReceiptImage.tsx';
import { Receipt } from './receiptPanel.tsx';

interface ReceiptItem {
  id?: number;
  name: string;
  expenseAccount: string;
  price: number;
}

interface ReadonlyReceiptViewProps {
  receipt: Receipt;
  items: ReceiptItem[];
}

const formatDate = (dateString: string): string => {
  const date = DateTime.fromISO(dateString);
  return date.isValid ? date.toLocaleString(DateTime.DATE_SHORT) : dateString;
};

const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

export const ReadonlyReceiptView = ({
  receipt,
  items,
}: ReadonlyReceiptViewProps) => {
  return (
    <Stack spacing={3}>
      {/* Receipt Image */}
      {receipt.fileUrl && (
        <Box>
          <ReceiptImage url={receipt.fileUrl} />
        </Box>
      )}

      {/* Receipt Details Section */}
      <Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, fontSize: '1rem', mb: 2 }}
        >
          Receipt Details
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
          }}
        >
          <DisplayField label="Payee" value={receipt.payee} />
          <DisplayField label="Date" value={formatDate(receipt.date)} />
          <DisplayField label="Source Account" value={receipt.sourceAccount} />
          <DisplayField
            label="Total Amount"
            value={formatCurrency(receipt.totalSum)}
          />
          <DisplayField
            label="Description"
            value={receipt.description}
            fullWidth
          />
        </Box>
      </Box>

      {/* Receipt Items */}
      <ReadonlyReceiptItems items={items} />
    </Stack>
  );
};
