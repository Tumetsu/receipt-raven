import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMergeReceiptItems } from './useMergeReceiptItems';
import type {
  FieldArrayWithId,
  UseFieldArrayReplace,
  UseFormGetValues,
} from 'react-hook-form';
import { createMockReceiptItems } from '../../../test/mocks';

// Type for the item structure in our tests
type TestItem = {
  name: string;
  price: number;
  expenseAccount: string;
};

// Type for the form values in our tests
type TestFormValues = {
  items: TestItem[];
};

describe('useMergeReceiptItems', () => {
  // Mock data
  const mockItems = createMockReceiptItems(4, index => ({
    name: ['Coffee', 'Milk', 'Bread', 'Eggs'][index],
    price: [12.99, 2.99, 1.99, 3.99][index],
    expenseAccount: 'Expenses:Groceries',
  }));

  // Helper to create fields with IDs (simulating React Hook Form field array)
  const createFields = () =>
    mockItems.map((item, index) => ({
      ...item,
      id: `field-${index}`,
    })) as FieldArrayWithId<TestFormValues, 'items'>[];

  let fields: ReturnType<typeof createFields>;
  let replaceMock: UseFieldArrayReplace<TestFormValues, 'items'>;
  let getValuesMock: UseFormGetValues<TestFormValues>;

  beforeEach(() => {
    fields = createFields();
    replaceMock = vi.fn() as unknown as UseFieldArrayReplace<
      TestFormValues,
      'items'
    >;
    getValuesMock = vi.fn(
      () => mockItems
    ) as unknown as UseFormGetValues<TestFormValues>;
  });

  describe('Initial state', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      expect(result.current.selectedReceiptItems).toEqual({});
      expect(result.current.isMergeAllowed).toBe(false);
    });
  });

  describe('Item selection', () => {
    it('should select an item when onSelectItem is called', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
      });

      expect(result.current.selectedReceiptItems['field-0']).toBe(true);
      expect(result.current.isMergeAllowed).toBe(false); // Still false with only 1 item
    });

    it('should toggle item selection on subsequent calls', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      // Select item
      act(() => {
        result.current.onSelectItem('field-0');
      });
      expect(result.current.selectedReceiptItems['field-0']).toBe(true);

      // Deselect item
      act(() => {
        result.current.onSelectItem('field-0');
      });
      expect(result.current.selectedReceiptItems['field-0']).toBe(false);
    });

    it('should allow selecting multiple items', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
        result.current.onSelectItem('field-2');
      });

      expect(result.current.selectedReceiptItems['field-0']).toBe(true);
      expect(result.current.selectedReceiptItems['field-1']).toBe(true);
      expect(result.current.selectedReceiptItems['field-2']).toBe(true);
    });
  });

  describe('Merge validation', () => {
    it('should not allow merge with no items selected', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      expect(result.current.isMergeAllowed).toBe(false);
    });

    it('should not allow merge with only one item selected', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
      });

      expect(result.current.isMergeAllowed).toBe(false);
    });

    it('should allow merge with two or more items selected', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
      });

      expect(result.current.isMergeAllowed).toBe(true);
    });
  });

  describe('Merge operation', () => {
    it('should merge two items correctly', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      // Select first two items (Coffee: 12.99, Milk: 2.99)
      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
      });

      act(() => {
        result.current.mergeItems();
      });

      expect(replaceMock).toHaveBeenCalledTimes(1);
      const mergedArray = (replaceMock as ReturnType<typeof vi.fn>).mock
        .calls[0][0];

      // Should have 3 items total (2 unselected + 1 merged)
      expect(mergedArray).toHaveLength(3);

      // Find the merged item (should be last)
      const mergedItem = mergedArray[mergedArray.length - 1];
      expect(mergedItem.name).toBe('Coffee, Milk');
      expect(mergedItem.price).toBe(15.98); // 12.99 + 2.99
      expect(mergedItem.expenseAccount).toBe('Expenses:Groceries'); // From last selected item
    });

    it('should merge all items when all are selected', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      // Select all items
      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
        result.current.onSelectItem('field-2');
        result.current.onSelectItem('field-3');
      });

      act(() => {
        result.current.mergeItems();
      });

      const mergedArray = (replaceMock as ReturnType<typeof vi.fn>).mock
        .calls[0][0];

      // Should have 1 item (all merged)
      expect(mergedArray).toHaveLength(1);

      const mergedItem = mergedArray[0];
      expect(mergedItem.name).toBe('Coffee, Milk, Bread, Eggs');
      expect(mergedItem.price).toBe(21.96); // 12.99 + 2.99 + 1.99 + 3.99
      expect(mergedItem.expenseAccount).toBe('Expenses:Groceries');
    });

    it('should preserve unselected non-contiguous items correctly', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      // Select items 0 and 2 (Coffee and Bread), leave 1 and 3 unselected (Milk and Eggs)
      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-2');
      });

      act(() => {
        result.current.mergeItems();
      });

      const mergedArray = (replaceMock as ReturnType<typeof vi.fn>).mock
        .calls[0][0];

      // Should have 3 items (2 unselected + 1 merged)
      expect(mergedArray).toHaveLength(3);

      const preservedItems = mergedArray.slice(0, -1);
      const mergedItem = mergedArray[mergedArray.length - 1];

      // Unselected items (Milk and Eggs) should be preserved in order
      expect(preservedItems[0].name).toBe('Milk');
      expect(preservedItems[0].price).toBe(2.99);
      expect(preservedItems[1].name).toBe('Eggs');
      expect(preservedItems[1].price).toBe(3.99);

      // Merged item should combine Coffee and Bread
      expect(mergedItem.name).toBe('Coffee, Bread');
      expect(mergedItem.price).toBe(14.98); // 12.99 + 1.99
      expect(mergedItem.expenseAccount).toBe('Expenses:Groceries'); // From last selected item
    });

    it('should round the merged price to 2 decimal places', () => {
      const itemsWithDecimals = [
        { name: 'Item1', price: 1.111, expenseAccount: 'Expenses:Test' },
        { name: 'Item2', price: 2.222, expenseAccount: 'Expenses:Test' },
      ];
      const fieldsWithDecimals = itemsWithDecimals.map((item, index) => ({
        ...item,
        id: `field-${index}`,
      })) as FieldArrayWithId<TestFormValues, 'items'>[];

      getValuesMock = vi.fn(
        () => itemsWithDecimals
      ) as unknown as UseFormGetValues<TestFormValues>;

      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields: fieldsWithDecimals,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
      });

      act(() => {
        result.current.mergeItems();
      });

      const mergedArray = (replaceMock as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      const mergedItem = mergedArray[mergedArray.length - 1];

      // 1.111 + 2.222 = 3.333, rounded to 3.33
      expect(mergedItem.price).toBe(3.33);
    });

    it('should use the expense account from the last selected item', () => {
      const itemsWithDifferentAccounts = [
        { name: 'Groceries', price: 10, expenseAccount: 'Expenses:Groceries' },
        {
          name: 'Electronics',
          price: 20,
          expenseAccount: 'Expenses:Electronics',
        },
        { name: 'Office', price: 30, expenseAccount: 'Expenses:Office' },
      ];
      const fieldsWithAccounts = itemsWithDifferentAccounts.map(
        (item, index) => ({
          ...item,
          id: `field-${index}`,
        })
      ) as FieldArrayWithId<TestFormValues, 'items'>[];

      getValuesMock = vi.fn(
        () => itemsWithDifferentAccounts
      ) as unknown as UseFormGetValues<TestFormValues>;

      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields: fieldsWithAccounts,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      // Select in order: Groceries, Electronics, Office
      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
        result.current.onSelectItem('field-2');
      });

      act(() => {
        result.current.mergeItems();
      });

      const mergedArray = (replaceMock as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      const mergedItem = mergedArray[mergedArray.length - 1];

      // Should use the last selected item's expense account (Office)
      expect(mergedItem.expenseAccount).toBe('Expenses:Office');
    });
  });

  describe('Reset functionality', () => {
    it('should clear selection when resetMerge is called', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
      });

      expect(
        Object.keys(result.current.selectedReceiptItems).length
      ).toBeGreaterThan(0);

      act(() => {
        result.current.resetMerge();
      });

      expect(result.current.selectedReceiptItems).toEqual({});
      expect(result.current.isMergeAllowed).toBe(false);
    });

    it('should automatically reset selection after merge', () => {
      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
      });

      act(() => {
        result.current.mergeItems();
      });

      expect(result.current.selectedReceiptItems).toEqual({});
      expect(result.current.isMergeAllowed).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty item array', () => {
      const emptyFields: FieldArrayWithId<TestFormValues, 'items'>[] = [];
      getValuesMock = vi.fn(
        () => []
      ) as unknown as UseFormGetValues<TestFormValues>;

      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields: emptyFields,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      expect(result.current.selectedReceiptItems).toEqual({});
      expect(result.current.isMergeAllowed).toBe(false);
    });

    it('should handle single item array', () => {
      const singleField = [fields[0]];
      const singleItem = [mockItems[0]];
      getValuesMock = vi.fn(
        () => singleItem
      ) as unknown as UseFormGetValues<TestFormValues>;

      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields: singleField,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
      });

      // Cannot merge with only one item total
      expect(result.current.isMergeAllowed).toBe(false);
    });

    it('should handle items with zero price', () => {
      const itemsWithZero = [
        { name: 'Free Item', price: 0, expenseAccount: 'Expenses:Test' },
        { name: 'Paid Item', price: 10, expenseAccount: 'Expenses:Test' },
      ];
      const fieldsWithZero = itemsWithZero.map((item, index) => ({
        ...item,
        id: `field-${index}`,
      })) as FieldArrayWithId<TestFormValues, 'items'>[];

      getValuesMock = vi.fn(
        () => itemsWithZero
      ) as unknown as UseFormGetValues<TestFormValues>;

      const { result } = renderHook(() =>
        useMergeReceiptItems({
          fields: fieldsWithZero,
          replace: replaceMock,
          getValues: getValuesMock,
          name: 'items',
        })
      );

      act(() => {
        result.current.onSelectItem('field-0');
        result.current.onSelectItem('field-1');
      });

      act(() => {
        result.current.mergeItems();
      });

      const mergedArray = (replaceMock as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      const mergedItem = mergedArray[mergedArray.length - 1];

      expect(mergedItem.price).toBe(10); // 0 + 10
      expect(mergedItem.name).toBe('Free Item, Paid Item');
    });
  });
});
