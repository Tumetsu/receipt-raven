import { Grid, Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { ReceiptList } from './components/receiptList.tsx';
import { useGetApiReceipts } from '../../api/generated/api.ts';
import { Receipt } from '../../api/generated/model/receipt.ts';
import { ReceiptPanel } from './components/receiptPanel.tsx';

export function ReceiptListView(): ReactElement {
  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiReceipts({
    query: { queryKey: ['receipts'] },
  });
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Typography variant="h1" gutterBottom>
          Receipts
        </Typography>
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 7,
        }}
      >
        {isPending && <span>Loading</span>}
        {isSuccess && (
          <ReceiptList
            receipts={result.data}
            onRowClick={id => {
              const receipt = result.data.find(r => r.id === id) || null;
              setSelectedReceipt(receipt);
            }}
          ></ReceiptList>
        )}
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 5,
        }}
      >
        {selectedReceipt && (
          <ReceiptPanel
            receipt={selectedReceipt}
            onApprove={() => setSelectedReceipt(null)}
            onClosePanel={() => setSelectedReceipt(null)}
          />
        )}
      </Grid>
    </Grid>
  );
}
