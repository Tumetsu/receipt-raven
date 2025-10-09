import { Grid, Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { ReceiptList } from './components/receiptList.tsx';
import { useGetApiReceipts } from '../../api/generated/api.ts';
import { GetApiReceipts200Item } from '../../api/generated/model';
import ReceiptPanel from './components/receiptPanel.tsx';

export function ReceiptListView(): ReactElement {
  const { isPending, isSuccess, data: result } = useGetApiReceipts();
  const [selectedReceipt, setSelectedReceipt] =
    useState<GetApiReceipts200Item | null>(null);

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Typography variant="h1" gutterBottom>
          Receipts
        </Typography>
      </Grid>
      <Grid size={7}>
        {isPending && <span>Loading</span>}
        {isSuccess && (
          <ReceiptList
            receipts={result.data}
            onRowClick={id => {
              const receipt = result.data.find(r => r.id === id) || null;
              console.log(id, receipt);
              setSelectedReceipt(receipt);
            }}
          ></ReceiptList>
        )}
      </Grid>
      <Grid size={5}>
        {selectedReceipt && <ReceiptPanel receipt={selectedReceipt} />}
      </Grid>
    </Grid>
  );
}
