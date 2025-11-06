import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { formatCurrency } from '../../../common/utils.js';

interface AssignPriceDifferenceModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  currentPrice: number;
  difference: number;
}

export const AssignPriceDifferenceModal = ({
  open,
  onClose,
  onConfirm,
  itemName,
  currentPrice,
  difference,
}: AssignPriceDifferenceModalProps) => {
  const newPrice = currentPrice + difference;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Assign Price Difference</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Do you want to assign the price difference of{' '}
          <strong>{formatCurrency(Math.abs(difference))}</strong> to "{itemName}
          "?
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          Current price: {formatCurrency(currentPrice)}
          <br />
          New price: {formatCurrency(newPrice)}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          autoFocus
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};
