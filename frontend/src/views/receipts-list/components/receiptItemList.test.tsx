import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useForm } from 'react-hook-form';
import type {
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
  FieldArrayWithId,
} from 'react-hook-form';
import { renderWithProviders } from '../../../test/utils.tsx';
import { ReceiptItemList } from './receiptItemList.tsx';
import { createMockReceiptItems } from '../../../test/mocks.ts';

// Mock the expense accounts hook
vi.mock('../hooks/useExpenseAccounts.ts', () => ({
  useExpenseAccounts: () => ({
    isSuccess: true,
    data: [
      'Expenses:Groceries',
      'Expenses:Transport',
      'Expenses:Entertainment',
    ],
  }),
}));

// Type for form values
type TestFormValues = {
  items: Array<{ name: string; price: number; expenseAccount: string }>;
  totalSum: number;
};

// Test wrapper component that sets up react-hook-form
function TestWrapper({
  defaultValues,
  children,
}: {
  defaultValues: TestFormValues;
  children: (props: {
    control: ReturnType<typeof useForm<TestFormValues>>['control'];
    fields: FieldArrayWithId<TestFormValues, 'items'>[];
    append: UseFieldArrayAppend<TestFormValues, 'items'>;
    remove: UseFieldArrayRemove;
    setValue: UseFormSetValue<TestFormValues>;
  }) => React.ReactElement;
}) {
  const { control, setValue } = useForm<TestFormValues>({
    defaultValues,
    mode: 'onChange',
  });

  // Create fields from defaultValues with ids
  const fields = defaultValues.items.map((item, index) => ({
    ...item,
    id: `field-${index}`,
  })) as FieldArrayWithId<TestFormValues, 'items'>[];

  const append = vi.fn() as unknown as UseFieldArrayAppend<
    TestFormValues,
    'items'
  >;
  const remove = vi.fn() as unknown as UseFieldArrayRemove;

  return children({ control, fields, append, remove, setValue });
}

describe('ReceiptItemList - Price Assignment Feature', () => {
  const mockItems = createMockReceiptItems(3);

  // Convert mock items to form data
  const formItems = mockItems.map(item => ({
    name: item.name,
    price: item.price,
    expenseAccount: item.expenseAccount,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Assign Button Visibility', () => {
    it('should show assign button when there is a price mismatch', () => {
      const defaultValues = {
        items: formItems,
        totalSum: 100.0, // Mismatch with items sum
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Should show assign buttons (one per item)
      const assignButtons = screen.getAllByTitle(
        'Assign price difference to this item'
      );
      expect(assignButtons.length).toBe(formItems.length);
    });

    it('should not show assign button when prices match', () => {
      // Calculate exact sum of items
      const itemsSum = formItems.reduce((sum, item) => sum + item.price, 0);

      const defaultValues = {
        items: formItems,
        totalSum: itemsSum, // Exact match
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Should not show assign buttons
      const assignButtons = screen.queryAllByTitle(
        'Assign price difference to this item'
      );
      expect(assignButtons.length).toBe(0);
    });

    it('should not show assign button in merge mode', () => {
      const defaultValues = {
        items: formItems,
        totalSum: 100.0, // Mismatch
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="merge" // Merge mode
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Should not show assign buttons in merge mode
      const assignButtons = screen.queryAllByTitle(
        'Assign price difference to this item'
      );
      expect(assignButtons.length).toBe(0);
    });

    it('should respect tolerance threshold of 0.01', () => {
      // Sum within tolerance
      const itemsSum = formItems.reduce((sum, item) => sum + item.price, 0);

      const defaultValues = {
        items: formItems,
        totalSum: itemsSum + 0.009, // Within 0.01 tolerance
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Should not show assign buttons (within tolerance)
      const assignButtons = screen.queryAllByTitle(
        'Assign price difference to this item'
      );
      expect(assignButtons.length).toBe(0);
    });
  });

  describe('Price Assignment Modal', () => {
    it('should open modal when assign button is clicked', async () => {
      const user = userEvent.setup();

      const defaultValues = {
        items: formItems,
        totalSum: 100.0,
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Click first item's assign button
      const assignButtons = screen.getAllByTitle(
        'Assign price difference to this item'
      );
      await user.click(assignButtons[0]);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText('Assign Price Difference')).toBeInTheDocument();
      });
    });

    it('should show correct item name in modal', async () => {
      const user = userEvent.setup();

      const defaultValues = {
        items: [
          {
            name: 'Specific Item',
            price: 10.0,
            expenseAccount: 'Expenses:Test',
          },
        ],
        totalSum: 15.0,
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      const assignButton = screen.getByTitle(
        'Assign price difference to this item'
      );
      await user.click(assignButton);

      await waitFor(() => {
        expect(screen.getByText(/Specific Item/)).toBeInTheDocument();
      });
    });

    it('should close modal when Cancel is clicked', async () => {
      const user = userEvent.setup();

      const defaultValues = {
        items: formItems,
        totalSum: 100.0,
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Open modal
      const assignButtons = screen.getAllByTitle(
        'Assign price difference to this item'
      );
      await user.click(assignButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Assign Price Difference')).toBeInTheDocument();
      });

      // Click Cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(
          screen.queryByText('Assign Price Difference')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Price Difference Calculation', () => {
    it('should calculate positive difference correctly', () => {
      const defaultValues = {
        items: [{ name: 'Item', price: 10.0, expenseAccount: 'Expenses:Test' }],
        totalSum: 15.0, // Difference: +5.0
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Should show assign button (indicating mismatch detected)
      expect(
        screen.getByTitle('Assign price difference to this item')
      ).toBeInTheDocument();
    });

    it('should calculate negative difference correctly', () => {
      const defaultValues = {
        items: [{ name: 'Item', price: 20.0, expenseAccount: 'Expenses:Test' }],
        totalSum: 15.0, // Difference: -5.0
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Should show assign button
      expect(
        screen.getByTitle('Assign price difference to this item')
      ).toBeInTheDocument();
    });

    it('should handle multiple items sum correctly', () => {
      const defaultValues = {
        items: [
          { name: 'Item 1', price: 10.0, expenseAccount: 'Expenses:Test' },
          { name: 'Item 2', price: 15.0, expenseAccount: 'Expenses:Test' },
          { name: 'Item 3', price: 20.0, expenseAccount: 'Expenses:Test' },
        ],
        totalSum: 50.0, // Sum: 45, Difference: +5.0
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={false}
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      // Should show assign buttons on all items
      const assignButtons = screen.getAllByTitle(
        'Assign price difference to this item'
      );
      expect(assignButtons.length).toBe(3);
    });
  });

  describe('Disabled State', () => {
    it('should disable assign button when component is disabled', () => {
      const defaultValues = {
        items: formItems,
        totalSum: 100.0,
      };

      renderWithProviders(
        <TestWrapper defaultValues={defaultValues}>
          {({ control, fields, append, remove, setValue }) => (
            <ReceiptItemList
              control={control}
              fields={fields}
              append={append}
              remove={remove}
              actionMode="save"
              name="items"
              disabled={true} // Disabled
              onMergeActivate={vi.fn()}
              selectedReceiptItems={{}}
              onSelectItem={vi.fn()}
              setValue={setValue}
            />
          )}
        </TestWrapper>
      );

      const assignButtons = screen.getAllByTitle(
        'Assign price difference to this item'
      );
      assignButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });
});
