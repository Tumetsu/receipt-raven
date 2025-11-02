import { useState } from 'react';
import {
  ArrayPath,
  FieldArrayWithId,
  FieldValues,
  Path,
  PathValue,
  UseFieldArrayReplace,
  UseFormGetValues,
} from 'react-hook-form';

type UseMergeReceiptItemsParams<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
> = {
  fields: FieldArrayWithId<TFieldValues, TFieldArrayName>[];
  replace: UseFieldArrayReplace<TFieldValues, TFieldArrayName>;
  getValues: UseFormGetValues<TFieldValues>;
  name: TFieldArrayName;
};

export function useMergeReceiptItems<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
>({
  fields,
  replace,
  getValues,
  name,
}: UseMergeReceiptItemsParams<TFieldValues, TFieldArrayName>) {
  const [selectedReceiptItems, setSelectedReceiptItems] = useState<
    Record<string, boolean>
  >({});

  const onSelectItem = (idx: string) => {
    setSelectedReceiptItems(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const mergeItems = () => {
    type ItemType = PathValue<TFieldValues, TFieldArrayName>[number];

    const currentItems = getValues(name as Path<TFieldValues>) as ItemType[];
    const mergeResult = fields.reduce<ItemType | null>((acc, field, index) => {
      if (selectedReceiptItems[field.id]) {
        const item = currentItems[index];

        if (!acc) {
          return {
            name: item.name,
            price: Number(item.price),
            expenseAccount: item.expenseAccount,
          } as ItemType;
        }

        const name = acc.name + ', ' + item.name;
        const price = Number(acc.price) + Number(item.price);

        return {
          name,
          price,
          expenseAccount: item.expenseAccount,
        } as ItemType;
      }
      return acc;
    }, null);

    // Filter out merged items and create new array with merged result
    // BUG: The index mapping here is incorrect!
    // After filtering, the array has new indices (0, 1, 2...), but we're using
    // those to access currentItems which still has the original indices.
    // This causes wrong items to be selected when non-contiguous items are merged.
    // Example: If we merge items 0 and 2 (leaving 1 and 3), after filter we get
    // [item1, item3] with indices [0, 1], but we access currentItems[0] and
    // currentItems[1] which gives us [item0, item1] instead of [item1, item3].
    // TODO: Fix by using the original field index or the field itself to get items
    const otherFields = fields
      .filter(field => !selectedReceiptItems[field.id])
      .map((_, index) => {
        const item = currentItems[index];
        return {
          name: item.name,
          price: item.price,
          expenseAccount: item.expenseAccount,
        } as ItemType;
      });

    if (mergeResult) {
      mergeResult.price = Number(mergeResult.price.toFixed(2));
      otherFields.push(mergeResult);
    }

    replace(otherFields as never);

    resetMerge();
  };

  const resetMerge = () => {
    setSelectedReceiptItems({});
  };

  const isMergeAllowed =
    Object.values(selectedReceiptItems).filter(Boolean).length > 1;

  return {
    selectedReceiptItems,
    onSelectItem,
    mergeItems,
    resetMerge,
    isMergeAllowed,
  };
}
