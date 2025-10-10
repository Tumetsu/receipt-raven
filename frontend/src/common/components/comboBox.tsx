import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { SxProps, Theme } from '@mui/material';

export function ComboBox(props: {
  options: string[];
  label: string;
  value?: string;
  required?: boolean;
  sx?: SxProps<Theme>;
}) {
  return (
    <Autocomplete
      disablePortal
      options={props.options}
      sx={props.sx}
      renderInput={params => (
        <TextField
          {...params}
          value={props.value}
          label={props.label}
          required={!!props.required}
        />
      )}
    ></Autocomplete>
  );
}
