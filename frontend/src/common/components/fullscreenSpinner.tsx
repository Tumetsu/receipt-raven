import { Backdrop, CircularProgress } from '@mui/material';
import { ReactElement } from 'react';

export function FullscreenSpinner(props: { open: boolean }): ReactElement {
  const { open } = props;
  return (
    <Backdrop
      sx={theme => ({
        color: theme.palette.common.white,
        zIndex: theme.zIndex.drawer + 1,
      })}
      open={open}
    >
      <CircularProgress />
    </Backdrop>
  );
}
