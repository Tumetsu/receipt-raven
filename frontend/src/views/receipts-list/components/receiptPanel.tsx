import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { Control, useWatch } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useModal } from '../hooks/useModal';
import { ReceiptImageModal } from './receiptImageModal.tsx';
import { Img } from '../../../common/components/Img.tsx';
import { Receipt } from '../../../api/generated/model/receipt.ts';
import { ReceiptItemList } from './receiptItemList.tsx';
import { useAccounts } from '../hooks/useGetAccounts.ts';
import { ControlledComboBox } from '../../../common/components/ComboBox.tsx';
import { ControlledTextField } from '../../../common/components/ControlledTextField.tsx';
import { useReceiptForm, IReceiptInputs } from './useReceiptForm.ts';

const PANEL_WIDTH = 480;

interface SlidingPanelProps {
  isClosing?: boolean;
}

const SlidingPanel = styled(Box, {
  shouldForwardProp: prop => prop !== 'isClosing',
})<SlidingPanelProps>(({ theme, isClosing }) => ({
  position: 'fixed',
  right: 0,
  top: 0,
  zIndex: 10,
  height: '100dvh',
  width: `${PANEL_WIDTH}px`,
  backgroundColor: '#ffffff',
  borderLeft: '1px solid #e5e7eb',
  boxShadow:
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  animation: isClosing ? 'slideOut 300ms ease-out' : 'slideIn 300ms ease-out',
  '@keyframes slideIn': {
    from: {
      transform: 'translateX(100%)',
    },
    to: {
      transform: 'translateX(0)',
    },
  },
  '@keyframes slideOut': {
    from: {
      transform: 'translateX(0)',
    },
    to: {
      transform: 'translateX(100%)',
    },
  },
  [theme.breakpoints.down('md')]: {
    width: '100vw',
    borderLeft: 'none',
  },
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const PanelContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(3),
}));

const PanelFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: '1px solid #e5e7eb',
}));

interface ReceiptHeaderProps {
  control: Control<IReceiptInputs>;
}

function ReceiptFormHeader({ control }: ReceiptHeaderProps) {
  const accounts = useAccounts();

  return (
    <Stack spacing={2} useFlexGap>
      {accounts.isSuccess && (
        <ControlledComboBox
          name="expenseAccount"
          control={control}
          options={accounts.data}
          label="Expense account"
          required
        />
      )}
    </Stack>
  );
}

interface ReceiptDetailsFormProps {
  control: Control<IReceiptInputs>;
}

function ReceiptDetailsForm({ control }: ReceiptDetailsFormProps) {
  return (
    <Stack spacing={2} useFlexGap>
      <ControlledTextField
        name="payee"
        control={control}
        label="Payee"
        required
      />
      <ControlledTextField
        name="date"
        control={control}
        label="Date"
        required
      />
      <ControlledTextField
        name="totalSum"
        control={control}
        label="Total sum"
        required
      />
    </Stack>
  );
}

interface ReceiptImageProps {
  filepath: string;
}

function ReceiptImage({ filepath }: ReceiptImageProps) {
  const imgModal = useModal();

  return (
    <>
      <Box
        sx={{
          aspectRatio: '3/4',
          backgroundColor: '#f3f4f6',
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
          },
        }}
        onClick={imgModal.openModal}
      >
        <Img
          src={filepath}
          alt="Receipt"
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
      <ReceiptImageModal
        open={imgModal.isOpen}
        onClose={imgModal.onModalClose}
        imagePath={filepath}
      />
    </>
  );
}

interface SumComparisonProps {
  control: Control<IReceiptInputs>;
}

function SumComparison({ control }: SumComparisonProps) {
  const items = useWatch({ control, name: 'items' });
  const totalSum = useWatch({ control, name: 'totalSum' });

  const itemsSum = Array.isArray(items)
    ? items.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    : 0;
  const totalSumNumber = Number(totalSum) || 0;
  const isMatch = Math.abs(itemsSum - totalSumNumber) < 0.01;

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      {!isMatch && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" color="text.secondary">
            Expected total:
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {totalSumNumber.toFixed(2)}
          </Typography>
        </Stack>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Items sum:
        </Typography>
        <Typography
          variant="body1"
          fontWeight={500}
          sx={{ color: isMatch ? 'text.primary' : 'error.main' }}
        >
          {itemsSum.toFixed(2)}
        </Typography>
      </Stack>
    </Stack>
  );
}

interface ReceiptActionsProps {
  isSavePending: boolean;
  isApproved: boolean;
  isInvalid: boolean;
}

function ReceiptActions({
  isSavePending,
  isApproved,
  isInvalid,
}: ReceiptActionsProps) {
  return (
    <Stack spacing={2} direction="row" useFlexGap>
      <Button
        fullWidth
        variant="contained"
        type="submit"
        disabled={isSavePending || isApproved || isInvalid}
      >
        Approve
      </Button>
    </Stack>
  );
}

interface ReceiptPanelProps {
  receipt: Receipt;
  onApprove: () => void;
  onClosePanel: () => void;
}

function ReceiptPanelContent({
  receipt,
  onApprove,
  onClosePanel,
}: ReceiptPanelProps) {
  const {
    formMethods,
    onSubmit,
    isSavePending,
    isItemsPending,
    isItemsSuccess,
  } = useReceiptForm(receipt, onApprove);

  const { handleSubmit, control } = formMethods;
  const isApproved = receipt.status === 'approved';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <PanelHeader>
        <Typography variant="h6" fontWeight={600}>
          Receipt Details
        </Typography>
        <IconButton onClick={onClosePanel} size="small">
          <ClearIcon />
        </IconButton>
      </PanelHeader>

      <PanelContent>
        <Stack spacing={3}>
          {/* Receipt Image */}
          <Box>
            <ReceiptImage filepath={receipt.filepath} />
          </Box>

          {/* Receipt Information */}
          <ReceiptFormHeader control={control} />
          <ReceiptDetailsForm control={control} />

          {/* Products/Items */}
          {isItemsPending && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}
          {isItemsSuccess && (
            <Box>
              <ReceiptItemList
                name="items"
                control={control}
                disabled={isApproved}
              />
            </Box>
          )}
        </Stack>
      </PanelContent>

      <PanelFooter>
        <SumComparison control={control} />
        <ReceiptActions
          isSavePending={isSavePending}
          isApproved={isApproved}
          isInvalid={!formMethods.formState.isValid}
        />
      </PanelFooter>
    </form>
  );
}

export function ReceiptPanel(props: ReceiptPanelProps) {
  const [isClosing, setIsClosing] = useState(false);

  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      props.onClosePanel();
    }, 300); // Match animation duration
  };

  const handleApprove = () => {
    setIsClosing(true);
    setTimeout(() => {
      props.onApprove();
    }, 300); // Match animation duration
  };

  return (
    <SlidingPanel isClosing={isClosing}>
      <ReceiptPanelContent
        {...props}
        onClosePanel={handleClose}
        onApprove={handleApprove}
      />
    </SlidingPanel>
  );
}
