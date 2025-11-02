import { Box, Typography, Stack, styled } from '@mui/material';
import { grey } from '@mui/material/colors';

interface ReceiptItem {
  id?: number;
  name: string;
  expenseAccount: string;
  price: number;
}

interface ReadonlyReceiptItemsProps {
  items: ReceiptItem[];
}

const ItemCard = styled(Box)(({ theme }) => ({
  backgroundColor: grey[50],
  border: `1px solid ${grey[200]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const ItemRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
});

export const ReadonlyReceiptItems = ({ items }: ReadonlyReceiptItemsProps) => {
  if (!items || items.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          No items
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
        Items
      </Typography>
      <Stack spacing={1.5}>
        {items.map((item, index) => (
          <ItemCard key={item.id ?? index}>
            <ItemRow>
              <Typography
                variant="body1"
                sx={{ fontWeight: 500, flex: 1, wordBreak: 'break-word' }}
              >
                {item.name}
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {item.price.toFixed(2)}€
              </Typography>
            </ItemRow>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              {item.expenseAccount}
            </Typography>
          </ItemCard>
        ))}
      </Stack>
    </Stack>
  );
};
