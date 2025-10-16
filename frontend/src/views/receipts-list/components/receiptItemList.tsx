import {
  Typography,
  IconButton,
  Box,
  styled,
  Button,
  Alert,
  keyframes,
} from '@mui/material';
import { grey, purple, blue } from '@mui/material/colors';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import MergeIcon from '@mui/icons-material/MergeType';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useGetApiLedgerAccounts } from '../../../api/generated/api';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import { Control, useFieldArray } from 'react-hook-form';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';
import { useState } from 'react';
import { IReceiptInputs } from './useReceiptForm.ts';

type ReceiptItem = IReceiptInputs['items'][number];

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const ProductCard = styled(Box)<{ mergeMode?: boolean; isSelected?: boolean }>(
  ({ theme, mergeMode, isSelected }) => ({
    border:
      mergeMode && isSelected
        ? `2px solid ${purple[500]}`
        : '1px solid #e5e7eb',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    position: 'relative',
    backgroundColor: mergeMode
      ? isSelected
        ? purple[50]
        : grey[100]
      : grey[50],
    cursor: mergeMode ? 'pointer' : 'default',
    transition: 'all 0.2s ease-in-out',
    '&:hover':
      mergeMode && !isSelected
        ? {
            borderColor: purple[300],
            backgroundColor: purple[50],
          }
        : {},
  })
);

const ProductHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),
}));

const MergeBanner = styled(Box)(({ theme }) => ({
  backgroundColor: blue[50],
  border: `1px solid ${blue[200]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const PulsingDot = styled(Box)(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: blue[600],
  marginRight: theme.spacing(1),
  animation: `${pulse} 2s ease-in-out infinite`,
}));

type ReceiptItemListProps = {
  control: Control<IReceiptInputs>;
  name: 'items';
  disabled: boolean;
};

const StyledSelectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
  borderBottom: `1px solid ${grey[200]}`,
}));

const SelectionHeader = ({ isSelected }: { isSelected: boolean }) => (
  <StyledSelectionHeader>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" sx={{ color: grey[600], fontWeight: 500 }}>
        {isSelected ? 'Selected for merge' : 'Click to select'}
      </Typography>
    </Box>
    {isSelected && (
      <CheckCircleIcon sx={{ color: purple[600], fontSize: 20 }} />
    )}
  </StyledSelectionHeader>
);

type NormalModeActionsProps = {
  onToggleMergeMode: () => void;
  onAddItem: () => void;
  disabled: boolean;
  hasMultipleFields: boolean;
};

const NormalModeActions = ({
  onToggleMergeMode,
  onAddItem,
  disabled,
  hasMultipleFields,
}: NormalModeActionsProps) => (
  <>
    <Button
      size="small"
      startIcon={<MergeIcon />}
      onClick={onToggleMergeMode}
      disabled={disabled || !hasMultipleFields}
      sx={{
        color: purple[600],
        fontWeight: 500,
        '&:hover': { backgroundColor: purple[50] },
        '&.Mui-disabled': {
          color: grey[400],
        },
      }}
    >
      Merge
    </Button>
    <IconButton
      onClick={onAddItem}
      disabled={disabled}
      size="small"
      sx={{
        color: blue[600],
        '&:hover': { backgroundColor: blue[50] },
      }}
    >
      <AddIcon />
    </IconButton>
  </>
);

type MergeModeActionsProps = {
  onMergeSelected: () => void;
  selectedCount: number;
};

const MergeModeActions = ({
  onMergeSelected,
  selectedCount,
}: MergeModeActionsProps) => (
  <Button
    size="small"
    variant="contained"
    startIcon={<MergeIcon />}
    onClick={onMergeSelected}
    disabled={selectedCount < 2}
    sx={{
      backgroundColor: purple[600],
      fontWeight: 500,
      '&:hover': { backgroundColor: purple[700] },
      '&.Mui-disabled': {
        backgroundColor: grey[300],
        color: grey[500],
      },
    }}
  >
    Merge Selected
  </Button>
);

type ProductsHeaderActionsProps = {
  mergeMode: boolean;
  onToggleMergeMode: () => void;
  onAddItem: () => void;
  onMergeSelected: () => void;
  disabled: boolean;
  hasMultipleFields: boolean;
  selectedCount: number;
};

const ProductsHeaderActions = ({
  mergeMode,
  onToggleMergeMode,
  onAddItem,
  onMergeSelected,
  disabled,
  hasMultipleFields,
  selectedCount,
}: ProductsHeaderActionsProps) => (
  <Box sx={{ display: 'flex', gap: 1 }}>
    {mergeMode ? (
      <MergeModeActions
        onMergeSelected={onMergeSelected}
        selectedCount={selectedCount}
      />
    ) : (
      <NormalModeActions
        onToggleMergeMode={onToggleMergeMode}
        onAddItem={onAddItem}
        disabled={disabled}
        hasMultipleFields={hasMultipleFields}
      />
    )}
  </Box>
);

export function ReceiptItemList({
  control,
  name,
  disabled,
}: ReceiptItemListProps) {
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<typeof fields>([]);

  const expenseAccounts = useGetApiLedgerAccounts(
    {
      type: 'Expenses',
    },
    {
      query: { queryKey: ['ledgerAccounts', 'Expenses'] },
    }
  );

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name,
  });

  const onAddItem = () => {
    append({ name: '', price: 0, category: '' });
  };

  const onRemoveItem = (idx: number) => {
    remove(idx);
  };

  const toggleMergeMode = () => {
    setMergeMode(!mergeMode);
    setSelectedProducts([]);
  };

  const toggleProductSelection = (field: (typeof fields)[number]) => {
    if (!mergeMode) return;

    setSelectedProducts(prev =>
      prev.some(p => p.id === field.id)
        ? prev.filter(p => p.id !== field.id)
        : [...prev, field]
    );
  };

  const handleMergeSelected = () => {
    if (selectedProducts.length < 2) return;

    // Calculate combined price and names from selected products
    let totalPrice = 0;
    const productNames: string[] = [];
    const firstCategory = selectedProducts[0].category || '';

    selectedProducts.forEach(product => {
      const price = Number(product.price) || 0;
      totalPrice += price;
      if (product.name) {
        productNames.push(product.name);
      }
    });

    // Create new merged product
    const mergedProduct: ReceiptItem = {
      name: productNames.join(', '),
      price: totalPrice,
      category: firstCategory,
    };

    // Filter out selected products and add the merged one
    const selectedIds = selectedProducts.map(p => p.id);
    const updatedFields = [
      ...fields.filter(field => !selectedIds.includes(field.id)),
      mergedProduct,
    ];

    replace(updatedFields);

    // Exit merge mode
    setMergeMode(false);
    setSelectedProducts([]);
  };
  const isFieldsDisabled = disabled || mergeMode;

  return (
    <>
      {/* Merge Mode Banner */}
      {mergeMode && (
        <MergeBanner>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PulsingDot />
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: blue[900] }}
            >
              {selectedProducts.length} product
              {selectedProducts.length !== 1 ? 's' : ''} selected
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={toggleMergeMode}
            sx={{
              color: blue[700],
              fontWeight: 500,
              '&:hover': { backgroundColor: blue[100] },
            }}
          >
            Cancel
          </Button>
        </MergeBanner>
      )}

      {/* Products Header with Add/Merge buttons */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Products
        </Typography>
        <ProductsHeaderActions
          mergeMode={mergeMode}
          onToggleMergeMode={toggleMergeMode}
          onAddItem={onAddItem}
          onMergeSelected={handleMergeSelected}
          disabled={disabled}
          hasMultipleFields={fields.length >= 2}
          selectedCount={selectedProducts.length}
        />
      </Box>

      {/* Product Cards */}
      {fields.map((field, idx) => {
        const isSelected = selectedProducts.some(p => p.id === field.id);
        return (
          <ProductCard
            key={field.id}
            mergeMode={mergeMode}
            isSelected={isSelected}
            onClick={() => toggleProductSelection(field)}
          >
            {/* Delete button (hidden in merge mode) */}
            {!mergeMode && (
              <IconButton
                sx={{ position: 'absolute', right: 4, top: 4 }}
                onClick={e => {
                  e.stopPropagation();
                  onRemoveItem(idx);
                }}
                disabled={disabled}
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}

            <Box sx={{ paddingRight: mergeMode ? 0 : 4 }}>
              {/* Selection Header in Merge Mode */}
              {mergeMode && <SelectionHeader isSelected={isSelected} />}

              {/* Product Fields */}
              <ProductHeader>
                <ControlledTextField
                  name={`items.${idx}.name`}
                  label="Product"
                  control={control}
                  required
                  disabled={isFieldsDisabled}
                  sx={{ flex: 1 }}
                />
                <ControlledTextField
                  name={`items.${idx}.price`}
                  label="Price"
                  control={control}
                  required
                  disabled={isFieldsDisabled}
                  sx={{ width: '100px' }}
                />
              </ProductHeader>
              {expenseAccounts.isSuccess && (
                <ControlledComboBox
                  name={`items.${idx}.category`}
                  control={control}
                  options={expenseAccounts.data}
                  label="Expense category"
                  required
                  disabled={isFieldsDisabled}
                />
              )}
            </Box>
          </ProductCard>
        );
      })}

      {/* Help Text Footer in Merge Mode */}
      {mergeMode && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            Merge mode:
          </Typography>
          <Typography variant="caption">
            Select 2 or more products to merge them into a single item with
            combined price. The merged product will use the category of the
            first selected item.
          </Typography>
        </Alert>
      )}
    </>
  );
}
