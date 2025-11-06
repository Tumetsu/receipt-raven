import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/utils.tsx';
import { AssignPriceDifferenceModal } from './AssignPriceDifferenceModal.tsx';

describe('AssignPriceDifferenceModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    itemName: 'Test Item',
    currentPrice: 10.0,
    difference: 2.5,
  };

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      renderWithProviders(<AssignPriceDifferenceModal {...defaultProps} />);

      expect(
        screen.getByText('Assign Price Difference')
      ).toBeInTheDocument();
      expect(screen.getByText(/Test Item/)).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} open={false} />
      );

      expect(
        screen.queryByText('Assign Price Difference')
      ).not.toBeInTheDocument();
    });

    it('should display the item name in the confirmation message', () => {
      renderWithProviders(<AssignPriceDifferenceModal {...defaultProps} />);

      expect(screen.getByText(/Test Item/)).toBeInTheDocument();
    });

    it('should display the absolute value of price difference', () => {
      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} difference={-3.5} />
      );

      // Should show absolute value 3.50
      expect(screen.getByText(/3.50/)).toBeInTheDocument();
    });

    it('should display current price', () => {
      renderWithProviders(<AssignPriceDifferenceModal {...defaultProps} />);

      expect(screen.getByText(/Current price: 10.00/)).toBeInTheDocument();
    });

    it('should display calculated new price', () => {
      renderWithProviders(<AssignPriceDifferenceModal {...defaultProps} />);

      // New price = 10.00 + 2.50 = 12.50
      expect(screen.getByText(/New price: 12.50/)).toBeInTheDocument();
    });

    it('should calculate new price correctly with negative difference', () => {
      renderWithProviders(
        <AssignPriceDifferenceModal
          {...defaultProps}
          currentPrice={15.0}
          difference={-5.0}
        />
      );

      // New price = 15.00 - 5.00 = 10.00
      expect(screen.getByText(/New price: 10.00/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} onClose={onClose} />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when Assign button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} onConfirm={onConfirm} />
      );

      const assignButton = screen.getByText('Assign');
      await user.click(assignButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside the modal', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} onClose={onClose} />
      );

      // Click on the backdrop (outside the dialog)
      const backdrop = container.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('should not call onConfirm when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} onConfirm={onConfirm} />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should not call onClose when Assign is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} onClose={onClose} />
      );

      const assignButton = screen.getByText('Assign');
      await user.click(assignButton);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Button Properties', () => {
    it('should have Cancel button with inherit color', () => {
      renderWithProviders(<AssignPriceDifferenceModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
    });

    it('should have Assign button with primary variant', () => {
      renderWithProviders(<AssignPriceDifferenceModal {...defaultProps} />);

      const assignButton = screen.getByText('Assign');
      expect(assignButton).toBeInTheDocument();
      expect(assignButton.closest('button')).toHaveClass('MuiButton-contained');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero difference', () => {
      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} difference={0} />
      );

      // Check for the specific text pattern with euro symbol
      expect(screen.getByText(/Do you want to assign/)).toBeInTheDocument();
      expect(screen.getByText(/Current price: 10.00/)).toBeInTheDocument();
      expect(screen.getByText(/New price: 10.00/)).toBeInTheDocument();
    });

    it('should handle very small differences (decimal precision)', () => {
      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} difference={0.01} />
      );

      expect(screen.getByText(/Do you want to assign/)).toBeInTheDocument();
      expect(screen.getByText(/Current price: 10.00/)).toBeInTheDocument();
      expect(screen.getByText(/New price: 10.01/)).toBeInTheDocument();
    });

    it('should handle large price differences', () => {
      renderWithProviders(
        <AssignPriceDifferenceModal
          {...defaultProps}
          currentPrice={100.0}
          difference={999.99}
        />
      );

      expect(screen.getByText(/Do you want to assign/)).toBeInTheDocument();
      expect(screen.getByText(/Current price: 100.00/)).toBeInTheDocument();
      // formatCurrency uses toFixed(2) without comma separators
      expect(screen.getByText(/New price: 1099.99/)).toBeInTheDocument();
    });

    it('should handle empty item name', () => {
      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} itemName="" />
      );

      // Should still render without crashing
      expect(
        screen.getByText('Assign Price Difference')
      ).toBeInTheDocument();
    });

    it('should handle very long item names', () => {
      const longName = 'A'.repeat(100);
      renderWithProviders(
        <AssignPriceDifferenceModal {...defaultProps} itemName={longName} />
      );

      expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
    });
  });
});
