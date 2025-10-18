import { Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { ReceiptList } from './components/receiptList.tsx';
import { useGetApiReceipts } from '../../api/generated/api.ts';
import { ReceiptPanel } from './components/receiptPanel.tsx';
import { ContentArea } from '../../common/components/ContentArea.tsx';
import { PageContainer } from '../../common/components/Layout.tsx';
import { useAccounts } from './hooks/useGetAccounts.ts';
import { useExpenseAccounts } from './hooks/useExpenseAccounts.ts';
import { GetApiReceipts200Item } from '../../api/generated/model';

export function ReceiptListView(): ReactElement {
  const {
    isPending,
    isSuccess,
    data: result,
  } = useGetApiReceipts({
    query: { queryKey: ['receipts'] },
  });
  const [selectedReceipt, setSelectedReceipt] =
    useState<GetApiReceipts200Item | null>(null);

  // Preload expense accounts to cache for when opening the receipt panel
  useExpenseAccounts();
  useAccounts();

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
