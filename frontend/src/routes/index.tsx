import { createFileRoute } from '@tanstack/react-router';
import { ReceiptListView } from '../views/receipts-list/receiptListView.tsx';

export const Route = createFileRoute('/')({
  component: ReceiptListView,
});
