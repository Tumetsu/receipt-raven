import { useState } from 'react';

export function useModal() {
  const [open, setOpen] = useState<boolean>(false);

  const onModalClose = () => {
    setOpen(false);
  };

  const openModal = () => {
    setOpen(true);
  };
  const closeModal = () => {
    setOpen(false);
  };

  return {
    isOpen: open,
    openModal,
    closeModal,
    onModalClose,
  };
}
