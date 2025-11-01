import { useState } from 'react';
import {
  ArrayPath,
  FieldArrayWithId,
  FieldValues,
  PathValue,
  UseFieldArrayReplace,
} from 'react-hook-form';

type UseMergeReceiptItemsParams<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
> = {
  fields: FieldArrayWithId<TFieldValues, TFieldArrayName>[];
  replace: UseFieldArrayReplace<TFieldValues, TFieldArrayName>;
};

export function useMergeReceiptItems<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues>,
>({
  fields,
  replace,
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

    const mergeResult = fields.reduce<ItemType | null>((acc, field) => {
      if (selectedReceiptItems[field.id]) {
        const item = field as ItemType;

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
    const otherFields = fields
      .filter(field => !selectedReceiptItems[field.id])
      .map(field => {
        const item = field as ItemType;
        return {
          name: item.name,
          price: item.price,
          expenseAccount: item.expenseAccount,
        } as ItemType;
      });

    if (mergeResult) {
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
