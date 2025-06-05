import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import leadsService from '../../services/leads';

const TIPIFICACION_CHOICES = [
  { value: '', label: 'Seleccionar Tipificación' },
  { value: 'NO CONTESTA', label: 'NO CONTESTA' },
  { value: 'DATO FALSO', label: 'DATO FALSO' },
  { value: 'NO INTERESADO - POR PROYECTO', label: 'NO INTERESADO - POR PROYECTO' },
  { value: 'FUERA DE SERVICIO', label: 'FUERA DE SERVICIO' },
  { value: 'NO REGISTRADO', label: 'NO REGISTRADO' },
  { value: 'VOLVER A LLAMAR', label: 'VOLVER A LLAMAR' },
  { value: 'APAGADO', label: 'APAGADO' },
  { value: 'SEGUIMIENTO', label: 'SEGUIMIENTO' },
  { value: 'NO INTERESADO - MEDIOS ECONOMICOS', label: 'NO INTERESADO - MEDIOS ECONOMICOS' },
  { value: 'CITA - ZOOM', label: 'CITA - ZOOM' },
  { value: 'NO INTERESADO - UBICACION', label: 'NO INTERESADO - UBICACION' },
  { value: 'NO INTERESADO - YA COMPRO EN OTRO LUGAR', label: 'NO INTERESADO - YA COMPRO EN OTRO LUGAR' },
  { value: 'INFORMACION WSP/CORREO', label: 'INFORMACION WSP/CORREO' },
  { value: 'TERCERO', label: 'TERCERO' },
  { value: 'NO INTERESADO - LEGALES', label: 'NO INTERESADO - LEGALES' },
  { value: 'CITA - SALA', label: 'CITA - SALA' },
  { value: 'CITA - PROYECTO', label: 'CITA - PROYECTO' },
  { value: 'CITA - POR CONFIRMAR', label: 'CITA - POR CONFIRMAR' },
  { value: 'CITA - HxH', label: 'CITA - HxH' },
  { value: 'YA ASISTIO', label: 'YA ASISTIO' },
  { value: 'DUPLICADO', label: 'DUPLICADO' },
  { value: 'YA ES PROPIETARIO', label: 'YA ES PROPIETARIO' },
  { value: 'AGENTE INMOBILIARIO', label: 'AGENTE INMOBILIARIO' },
  { value: 'GESTON WSP', label: 'GESTON WSP' },
  { value: 'NO CALIFICA', 'label': 'NO CALIFICA' },
];

const MEDIO_CAPTACION_CHOICES = [
  { value: '', label: 'Seleccione un Medio' },
  { value: 'Campo (Centros Comerciales)', label: 'Campo (Centros Comerciales)' },
  { value: 'Redes Sociales (Facebook)', label: 'Redes Sociales (Facebook)' },
  { value: 'Redes Sociales (Instagram)', label: 'Redes Sociales (Instagram)' },
  { value: 'Redes Sociales (WhatsApp)', label: 'Redes Sociales (WhatsApp)' },
  { value: 'Referidos', label: 'Referidos' },
];


function LeadFormModal({ open, onClose, leadId, onSaveSuccess }) {
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [asesores, setAsesores] = useState([]);

  // MODIFICACIÓN: Inicializar useForm con defaultValues para asegurar que tipificacion siempre inicia como ''
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      tipificacion: '', // Valor por defecto seguro para el campo de selección
    }
  });

  // Esto es para asegurar que el Select de MUI siempre tenga un valor controlado y no 'undefined'
  const watchedTipificacion = watch('tipificacion');


  const fetchAsesores = async () => {
    try {
      const data = await leadsService.getUsers({ page_size: 1000 });
      setAsesores(data.results || []);
    } catch (err) {
      console.error('Error fetching asesores:', err);
      setError('Error al cargar la lista de asesores.');
    }
  };

  useEffect(() => {
    if (!open) {
      // Al cerrar el modal, resetear el formulario. Esto lo devolverá a los defaultValues
      // o a los valores pasados si el modal se reutiliza para un nuevo lead.
      reset();
      setError('');
      setLoadingForm(true);
      return;
    }

    fetchAsesores();

    if (leadId) {
      const fetchLead = async () => {
        try {
          const leadData = await leadsService.getLeadById(leadId);
          reset({
            ...leadData,
            asesor: leadData.asesor ? leadData.asesor.id : '',
            // Asegurar que tipificacion sea siempre una cadena, recortar espacios y fallar a ''
            tipificacion: (leadData.tipificacion && typeof leadData.tipificacion === 'string')
                                ? leadData.tipificacion.trim()
                                : '',
          });
        } catch (err) {
          setError('Error al cargar los datos del lead.');
          console.error('Error fetching lead for edit:', err);
        } finally {
          setLoadingForm(false);
        }
      };
      fetchLead();
    } else {
      // Para nuevos leads, llamar a reset sin argumentos específicos para tipificacion
      // ya que defaultValues en useForm ya lo inicializa a ''.
      reset({
        nombre: '', celular: '', proyecto: '', medio: '', distrito: '',
        // tipificacion: '' (este campo ya está cubierto por defaultValues en useForm)
        observacion: '', opc: '', observacion_opc: '',
        asesor: '',
      });
      setLoadingForm(false);
    }
  }, [open, leadId, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');

    const payload = {
      ...data,
      asesor: data.asesor || null,
    };

    try {
      if (leadId) {
        await leadsService.updateLead(leadId, payload);
      } else {
        await leadsService.createLead(payload);
      }
      onSaveSuccess();
    } catch (err) {
      setError('Error al guardar el lead: ' + (err.response?.data?.celular || err.message));
      console.error('Error saving lead:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {leadId ? 'Editar Lead' : 'Crear Nuevo Lead'}
      </DialogTitle>
      <DialogContent>
        {loadingForm ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  {...register('nombre', { required: 'El nombre es requerido' })}
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Celular"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  {...register('celular', {
                    required: 'El celular es requerido',
                    pattern: { value: /^[0-9]+$/, message: 'Solo números' }
                  })}
                  error={!!errors.celular}
                  helperText={errors.celular?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Proyecto"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  {...register('proyecto', { required: 'El proyecto es requerido' })}
                  error={!!errors.proyecto}
                  helperText={errors.proyecto?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Medio de Captación</InputLabel>
                  <Select
                    label="Medio de Captación"
                    defaultValue=""
                    {...register('medio')}
                  >
                    {MEDIO_CAPTACION_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Distrito"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  {...register('distrito')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.tipificacion}>
                  <InputLabel>Tipificación</InputLabel>
                  <Select
                    label="Tipificación"
                    value={watchedTipificacion} /* Vincula explícitamente el valor para control */
                    {...register('tipificacion', { required: 'La tipificación es requerida' })}
                  >
                    {TIPIFICACION_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.tipificacion && <Typography color="error" variant="caption">{errors.tipificacion.message}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Asesor</InputLabel>
                  <Select
                    label="Asesor"
                    defaultValue=""
                    {...register('asesor')}
                  >
                    <MenuItem value="">Sin Asignar</MenuItem>
                    {asesores.map((asesor) => (
                      <MenuItem key={asesor.id} value={asesor.id}>
                        {asesor.username} ({asesor.first_name} {asesor.last_name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observación"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  {...register('observacion')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="OPC (Método de Captación Original)"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  {...register('opc')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Observación OPC"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                  {...register('observacion_opc')}
                />
              </Grid>
            </Grid>
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={submitting}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit(onSubmit)} color="primary" variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : (leadId ? 'Actualizar Lead' : 'Crear Lead')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LeadFormModal;