import {
  TextField,
  Typography,
  IconButton,
  Card,
  Grid,
  Stack,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { GetApiReceiptsReceiptIdItems200Item } from '../../../api/generated/model';

export function ReceiptItemList(props: {
  items: GetApiReceiptsReceiptIdItems200Item[];
}) {
  const { items } = props;
  return (
    <>
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Products
      </Typography>
      {items.map(row => (
        <Card
          key={row.id}
          sx={{ position: 'relative', marginBottom: 2, padding: 2 }}
        >
          <IconButton sx={{ position: 'absolute', right: 4, top: 1 }}>
            <ClearIcon />
          </IconButton>
          <Grid container gap={2}>
            <Grid size={11}>
              <Stack direction="row" useFlexGap gap={2}>
                <TextField label="Product" value={row.name} />
                <TextField label="Price" value={row.price} />
              </Stack>
            </Grid>
            <Grid size={11}>
              <TextField
                sx={{ width: '100%' }}
                label="Expense category"
                value={row.category}
              />
            </Grid>
          </Grid>
        </Card>
      ))}
    </>
  );
}
