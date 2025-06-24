import { Checkbox, FormControlLabel } from '@mui/material';

        <TextField
          label="Celular"
          variant="outlined"
          fullWidth
          margin="normal"
          {...register('celular', { required: 'El celular es requerido' })}
          error={!!errors.celular}
          helperText={errors.celular?.message}
        />
        {/* Campo es_directeo */}
        <FormControlLabel
          control={<Checkbox {...register('es_directeo')} />}
          label="¿Este lead es Directeo? (Captado y gestionado completamente por OPC)"
        /> 