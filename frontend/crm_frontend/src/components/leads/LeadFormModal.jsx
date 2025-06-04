// frontend/crm_frontend/src/components/leads/LeadFormModal.jsx
import React, { useEffect, useState } from 'react';
// Removido: useParams, useNavigate (porque ya no es una página con rutas)
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
  Dialog,        // <-- NUEVA IMPORTACIÓN
  DialogTitle,   // <-- NUEVA IMPORTACIÓN
  DialogContent, // <-- NUEVA IMPORTACIÓN
  DialogActions, // <-- NUEVA IMPORTACIÓN
} from '@mui/material';
import leadsService from '../../services/leads';

// Opciones de tipificación (debe coincidir con tu modelo de Django)
const TIPIFICACION_CHOICES = [
  { value: 'Nuevo', label: 'Nuevo' },
  { value: 'Contactado', label: 'Contactado' },
  { value: 'Interesado', label: 'Interesado' },
  { value: 'No Contesta', label: 'No Contesta' },
  { value: 'Descartado', label: 'Descartado' },
  { value: 'Cita Agendada', label: 'Cita Agendada' },
  { value: 'Cita Confirmada', label: 'Cita Confirmada' },
  { value: 'Cita Realizada', label: 'Cita Realizada' },
  { value: 'Seguimiento', label: 'Seguimiento' },
];

// Este componente ahora acepta props: open, onClose, leadId (para editar), onSaveSuccess (callback)
function LeadFormModal({ open, onClose, leadId, onSaveSuccess }) {
  const [loadingForm, setLoadingForm] = useState(true); // Para el spinner cuando carga datos del lead en edición
  const [submitting, setSubmitting] = useState(false); // Para el spinner del botón al guardar
  const [error, setError] = useState('');
  const [asesores, setAsesores] = useState([]); // Para el selector de asesor

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
    if (!open) { // Si el modal se cierra, reseteamos el formulario y los errores
      reset();
      setError('');
      setLoadingForm(true); // Preparar para la próxima apertura
      return;
    }

    fetchAsesores(); // Cargar asesores cada vez que se abre el modal

    if (leadId) {
      // Si estamos en modo edición (se pasó un leadId), cargamos los datos del lead
      const fetchLead = async () => {
        try {
          const leadData = await leadsService.getLeadById(leadId);
          reset({ // 'reset' de react-hook-form para llenar el formulario
            ...leadData,
            asesor: leadData.asesor ? leadData.asesor.id : '', // Asegura que 'asesor' sea el ID numérico
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
      // Si es un lead nuevo, reseteamos el formulario a valores por defecto
      reset({
        nombre: '', celular: '', proyecto: '', medio: '', distrito: '',
        tipificacion: 'Nuevo', observacion: '', opc: '', observacion_opc: '',
        asesor: '', // Deja vacío para 'Sin Asignar'
      });
      setLoadingForm(false);
    }
  }, [open, leadId, reset]); // Recarga cuando el modal se abre/cierra o cambia el leadId

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');

    const payload = {
      ...data,
      asesor: data.asesor || null, // Asegura que el ID del asesor sea null si no se selecciona
    };

    try {
      if (leadId) {
        await leadsService.updateLead(leadId, payload);
      } else {
        await leadsService.createLead(payload);
      }
      onSaveSuccess(); // Callback para que el componente padre recargue la lista
      // onClose(); // Esto se llama implícitamente en onSaveSuccess()
    } catch (err) {
      setError('Error al guardar el lead: ' + (err.response?.data?.celular || err.message));
      console.error('Error saving lead:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"> {/* Usamos el componente Dialog */}
      <DialogTitle>
        {leadId ? 'Editar Lead' : 'Crear Nuevo Lead'}
      </DialogTitle>
      <DialogContent>
        {loadingForm ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate> {/* noValidate desactiva la validación HTML5 */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Los campos del formulario son los mismos que antes */}
            <TextField
              label="Nombre"
              variant="outlined"
              fullWidth
              margin="normal"
              {...register('nombre', { required: 'El nombre es requerido' })}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
            />
            <TextField
              label="Celular"
              variant="outlined"
              fullWidth
              margin="normal"
              {...register('celular', {
                required: 'El celular es requerido',
                pattern: { value: /^[0-9]+$/, message: 'Solo números' } // Validación de solo números
              })}
              error={!!errors.celular}
              helperText={errors.celular?.message}
            />
            <TextField
              label="Proyecto"
              variant="outlined"
              fullWidth
              margin="normal"
              {...register('proyecto', { required: 'El proyecto es requerido' })}
              error={!!errors.proyecto}
              helperText={errors.proyecto?.message}
            />
            <TextField
              label="Medio de Captación"
              variant="outlined"
              fullWidth
              margin="normal"
              {...register('medio')}
            />
            <TextField
              label="Distrito"
              variant="outlined"
              fullWidth
              margin="normal"
              {...register('distrito')}
            />

            <FormControl fullWidth margin="normal" error={!!errors.tipificacion}>
              <InputLabel>Tipificación</InputLabel>
              <Select
              label="Tipificación"
              defaultValue="Nuevo" // Puedes usar defaultValue aquí para el estado inicial si el reset no lo cubre inmediatamente
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

            <FormControl fullWidth margin="normal">
              <InputLabel>Asesor</InputLabel>
              <Select
              label="Asesor"
              defaultValue="" // Puedes usar defaultValue aquí para el estado inicial
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

            <TextField
              label="Observación"
              variant="outlined"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              {...register('observacion')}
            />
            <TextField
              label="OPC (Método de Captación Original)"
              variant="outlined"
              fullWidth
              margin="normal"
              {...register('opc')}
            />
            <TextField
              label="Observación OPC"
              variant="outlined"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              {...register('observacion_opc')}
            />
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