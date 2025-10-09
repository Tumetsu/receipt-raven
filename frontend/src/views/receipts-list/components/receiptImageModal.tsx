import { Box, Modal, styled } from '@mui/material';
import { Img } from '../../../common/components/Img.tsx';

const ModalContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
  p: 4,
}));

export function ReceiptImageModal(props: {
  open: boolean;
  onClose: () => void;
  imagePath: string;
}) {
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      aria-labelledby="modal-receipt-image"
      aria-describedby="modal-receipt-image"
    >
      <ModalContainer>
        <Img src={props.imagePath} alt="Receipt"></Img>
      </ModalContainer>
    </Modal>
  );
}
