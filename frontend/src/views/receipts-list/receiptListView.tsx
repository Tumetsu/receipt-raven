import { Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { ReceiptList } from './components/receiptList.tsx';
import { useGetApiReceipts } from '../../api/generated/api.ts';
import { Receipt } from '../../api/generated/model/receipt.ts';
import { ReceiptPanel } from './components/receiptPanel.tsx';
import { ContentArea } from '../../common/components/ContentArea.tsx';
import { PageContainer } from '../../common/components/Layout.tsx';

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
    <PageContainer>
      <ContentArea>
        {isPending && <Typography>Loading...</Typography>}
        {isSuccess && (
          <ReceiptList
            receipts={result}
            selectedReceiptId={selectedReceipt?.id}
            onRowClick={id => {
              const receipt = result.find(r => r.id === id) || null;
              setSelectedReceipt(receipt);
            }}
          />
        )}
      </ContentArea>

      {selectedReceipt && (
        <ReceiptPanel
          receipt={selectedReceipt}
          onApprove={() => setSelectedReceipt(null)}
          onClosePanel={() => setSelectedReceipt(null)}
        />
      )}
    </PageContainer>
  );
}
