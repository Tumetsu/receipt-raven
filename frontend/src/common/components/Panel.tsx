import { Box, IconButton, styled, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import {
  useState,
  useEffect,
  ReactNode,
  forwardRef,
  useImperativeHandle,
} from 'react';

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
  zIndex: 1200, // Higher than AppBar (1100) to appear above sticky header
  height: '100dvh',
  width: `${PANEL_WIDTH}px`,
  backgroundColor: '#ffffff',
  borderLeft: '1px solid #e5e7eb',
  boxShadow:
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  animation: isClosing
    ? 'slideOut 300ms ease-out forwards'
    : 'slideIn 300ms ease-out',
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
  gap: theme.spacing(1),
}));

const HeaderActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

export const PanelContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(3),
}));

interface PanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  renderHeaderActions?: ReactNode;
}

export interface PanelRef {
  close: (callback?: () => void) => void;
}

export const Panel = forwardRef<PanelRef, PanelProps>(
  ({ title, onClose, children, renderHeaderActions }, ref) => {
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

    const triggerClose = (callback?: () => void) => {
      setIsClosing(true);
      setTimeout(() => {
        if (callback) {
          callback();
        } else {
          onClose();
        }
      }, 300); // Match animation duration
    };

    useImperativeHandle(ref, () => ({
      close: triggerClose,
    }));

    return (
      <SlidingPanel isClosing={isClosing}>
        <PanelHeader>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <HeaderActions>
            {renderHeaderActions}
            <IconButton onClick={() => triggerClose()} size="small">
              <ClearIcon />
            </IconButton>
          </HeaderActions>
        </PanelHeader>
        {children}
      </SlidingPanel>
    );
  }
);
