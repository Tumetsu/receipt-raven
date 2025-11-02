import type { GetApiReceiptsReceiptIdItems200Item } from '../api/generated/model';

/**
 * Factory function to create mock receipt items for testing
 */
export function createMockReceiptItem(
  overrides?: Partial<GetApiReceiptsReceiptIdItems200Item>
): GetApiReceiptsReceiptIdItems200Item {
  return {
    id: Math.floor(Math.random() * 10000),
    receiptId: 1,
    name: 'Test Item',
    expenseAccount: 'Expenses:Groceries',
    price: 9.99,
    ...overrides,
  };
}

/**
 * Factory function to create multiple mock receipt items
 */
export function createMockReceiptItems(
  count: number,
  overrides?: (index: number) => Partial<GetApiReceiptsReceiptIdItems200Item>
): GetApiReceiptsReceiptIdItems200Item[] {
  return Array.from({ length: count }, (_, index) => {
    const defaultOverrides = {
      id: index + 1,
      name: `Item ${index + 1}`,
      price: (index + 1) * 5.0,
      expenseAccount:
        index % 2 === 0 ? 'Expenses:Groceries' : 'Expenses:Shopping',
    };
    const customOverrides = overrides?.(index) ?? {};
    return createMockReceiptItem({ ...defaultOverrides, ...customOverrides });
  });
}

/**
 * Common test data: A set of grocery items
 */
export const mockGroceryItems = createMockReceiptItems(3, index => ({
  name: ['Milk', 'Bread', 'Eggs'][index],
  price: [2.99, 1.99, 3.99][index],
  expenseAccount: 'Expenses:Groceries',
}));

/**
 * Common test data: A mixed set of items from different categories
 */
export const mockMixedItems = [
  createMockReceiptItem({
    id: 1,
    name: 'Coffee',
    price: 12.99,
    expenseAccount: 'Expenses:Groceries',
  }),
  createMockReceiptItem({
    id: 2,
    name: 'Notebook',
    price: 4.99,
    expenseAccount: 'Expenses:Office',
  }),
  createMockReceiptItem({
    id: 3,
    name: 'Pen',
    price: 1.99,
    expenseAccount: 'Expenses:Office',
  }),
  createMockReceiptItem({
    id: 4,
    name: 'Snacks',
    price: 5.99,
    expenseAccount: 'Expenses:Groceries',
  }),
];
