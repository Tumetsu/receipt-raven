import { Box } from '@mui/material';
import { Img } from '../Img.tsx';
import { ReceiptImageModal } from './ReceiptImageModal.tsx';
import { useModal } from '../../hooks/useModal.ts';

interface ReceiptImageProps {
  url: string;
}

export function ReceiptImage({ url }: ReceiptImageProps) {
  const imgModal = useModal();

  return (
    <>
      <Box
        sx={{
          aspectRatio: '3/4',
          backgroundColor: 'grey.100',
          borderRadius: 2,
          border: theme => `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
          },
        }}
        onClick={imgModal.openModal}
      >
        <Img
          src={url}
          alt="Receipt"
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
      <ReceiptImageModal
        open={imgModal.isOpen}
        onClose={imgModal.onModalClose}
        url={url}
      />
    </>
  );
}
