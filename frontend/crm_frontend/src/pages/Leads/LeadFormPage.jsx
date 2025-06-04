// frontend/crm_frontend/src/pages/Leads/LeadFormPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Paper, // <--- ¡Añade esta línea!
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

function LeadFormPage() {
  const { id } = useParams(); // ID del lead si estamos editando
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    fetchAsesores();
    if (id) {
      // Si hay un ID, estamos editando, cargar los datos del lead
      const fetchLead = async () => {
        try {
          const leadData = await leadsService.getLeadById(id);
          reset({ // Llena el formulario con los datos del lead
            ...leadData,
            // Asegúrate de que asesor_id se mapee correctamente
            asesor: leadData.asesor ? leadData.asesor.id : '',
          });
        } catch (err) {
          setError('Error al cargar los datos del lead.');
          console.error('Error fetching lead for edit:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchLead();
    } else {
      // Si es un lead nuevo, no hay que cargar datos
      setLoading(false);
    }
  }, [id, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Ajusta la data para el backend si es necesario (ej. asesor es un ID)
    const payload = {
      ...data,
      asesor: data.asesor || null, // Asegura que sea null si no se selecciona asesor
    };

    try {
      if (id) {
        await leadsService.updateLead(id, payload);
        setSuccess('Lead actualizado con éxito.');
      } else {
        await leadsService.createLead(payload);
        setSuccess('Lead creado con éxito.');
        reset(); // Limpia el formulario después de crear
      }
      navigate('/leads'); // Redirige a la lista de leads
    } catch (err) {
      setError('Error al guardar el lead: ' + (err.response?.data?.celular || err.message));
      console.error('Error saving lead:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {id ? 'Editar Lead' : 'Crear Nuevo Lead'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
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
            {...register('celular', { required: 'El celular es requerido' })}
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
              defaultValue="Nuevo" // Valor por defecto si no se carga
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
              defaultValue="" // Sin asesor por defecto
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

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/leads')} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : (id ? 'Actualizar Lead' : 'Crear Lead')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default LeadFormPage;