import { Box, Button, Stack, styled } from '@mui/material';
import * as React from 'react';
import { ActionType } from './receiptPanel.tsx';
import MergeIcon from '@mui/icons-material/MergeType';

const FooterContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  paddingBottom: `calc(${theme.spacing(2)} + env(safe-area-inset-bottom, 0px))`,
  borderTop: '1px solid #e5e7eb',
  flexShrink: 0,
  backgroundColor: '#ffffff',
}));

interface ReceiptActionsProps {
  isDisabled: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}
function SaveActions({ isDisabled }: ReceiptActionsProps) {
  return (
    <Stack spacing={2} direction="row" useFlexGap>
      <Button fullWidth variant="contained" type="submit" disabled={isDisabled}>
        Save Receipt
      </Button>
    </Stack>
  );
}

function ApproveActions({ isDisabled }: ReceiptActionsProps) {
  return (
    <Stack spacing={2} direction="row" useFlexGap>
      <Button fullWidth variant="contained" type="submit" disabled={isDisabled}>
        Approve Receipt
      </Button>
    </Stack>
  );
}

function MergeActions({
  isDisabled,
  onSuccess,
  onCancel,
}: ReceiptActionsProps) {
  return (
    <Stack spacing={2} direction="row" useFlexGap>
      <Button
        fullWidth
        color="primary"
        variant="contained"
        onClick={onSuccess}
        disabled={isDisabled}
        startIcon={<MergeIcon />}
      >
        Merge
      </Button>
      <Button fullWidth variant="outlined" onClick={onCancel}>
        Cancel
      </Button>
    </Stack>
  );
}

function getActionToRender(
  actionType: ActionType,
  isDisabled: boolean,
  onSuccess?: () => void,
  onCancel?: () => void
) {
  switch (actionType) {
    case 'save':
      return <SaveActions isDisabled={isDisabled} />;
    case 'approve':
      return <ApproveActions isDisabled={isDisabled} />;
    case 'merge':
      return (
        <MergeActions
          isDisabled={isDisabled}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      );
    default:
      return null;
  }
}

interface PanelFooterProps {
  actionType: ActionType;
  actionStatusComponent?: React.ReactNode;
  onSuccess?: () => void;
  onCancel?: () => void;
  isActionDisabled: boolean;
}

export function PanelFooter({
  actionType,
  actionStatusComponent,
  isActionDisabled,
  onSuccess,
  onCancel,
}: PanelFooterProps) {
  const actionComponent = getActionToRender(
    actionType,
    isActionDisabled,
    onSuccess,
    onCancel
  );

  return (
    <FooterContainer>
      {actionStatusComponent ? actionStatusComponent : undefined}
      {actionComponent}
    </FooterContainer>
  );
}
