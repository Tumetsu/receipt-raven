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
    // Use reduce to preserve the correct index mapping between fields and currentItems
    const otherFields = fields.reduce<ItemType[]>((acc, field, index) => {
      if (!selectedReceiptItems[field.id]) {
        const item = currentItems[index];
        acc.push({
          name: item.name,
          price: item.price,
          expenseAccount: item.expenseAccount,
        } as ItemType);
      }
      return acc;
    }, []);

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
