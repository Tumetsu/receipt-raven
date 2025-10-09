import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { GetApiReceiptsReceiptIdItems200Item } from '../../../api/generated/model';

export function ReceiptItemList(props: {
  items: GetApiReceiptsReceiptIdItems200Item[];
}) {
  const { items } = props;
  return (
    <>
      <Typography variant="h4">Products</Typography>
      <TableContainer component={Box}>
        <Table sx={{ minWidth: '100%' }} aria-label="Receipt items table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(row => (
              <TableRow
                key={row.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                <TableCell component="th" scope="row">
                  <TextField value={row.name} />
                </TableCell>
                <TableCell align="right">
                  <TextField value={row.price} />
                </TableCell>
                <TableCell padding="none">
                  <IconButton>
                    <ClearIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
