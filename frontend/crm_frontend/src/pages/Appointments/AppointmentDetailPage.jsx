// frontend/crm_frontend/src/pages/Appointments/AppointmentDetailPage.jsx (NUEVO ARCHIVO)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import appointmentsService from '../../services/appointments'; // Usamos el servicio de citas
import AppointmentFormModal from '../../components/appointments/AppointmentFormModal'; // Importar el modal de formulario
import moment from 'moment'; // Importar moment para formato de fecha

function AppointmentDetailPage() {
  const { id } = useParams(); // Obtiene el ID de la cita de la URL
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [actions, setActions] = useState([]); // Almacena las acciones combinadas de la cita y el lead
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para controlar el modal de edición de la cita
  const [openAppointmentFormModal, setOpenAppointmentFormModal] = useState(false);
  const [editingAppointmentData, setEditingAppointmentData] = useState(null); // Datos de la cita a editar

  const fetchAppointmentAndActions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Obtener los detalles de la cita
      const appointmentData = await appointmentsService.getAppointmentById(id);
      setAppointment(appointmentData);

      // 2. Obtener las acciones combinadas de la cita y su lead asociado
      // Usaremos el endpoint personalizado /appointments/{id}/actions/ que creamos en el backend
      const combinedActions = await appointmentsService.getAppointmentActions(id);
      setActions(combinedActions);

    } catch (err) {
      setError('Error al cargar los detalles de la cita o sus acciones.');
      console.error('Error fetching appointment details or actions:', err);
    } finally {
      setLoading(false);
    }
  }, [id]); // Depende del ID de la URL

  useEffect(() => {
    fetchAppointmentAndActions();
  }, [fetchAppointmentAndActions]);

  // Handlers para el modal de edición de la cita
  const handleOpenEditAppointmentModal = () => {
    setEditingAppointmentData(appointment); // Pasa los datos actuales de la cita al modal
    setOpenAppointmentFormModal(true);
  };

  const handleCloseAppointmentFormModal = () => {
    setOpenAppointmentFormModal(false);
    setEditingAppointmentData(null); // Limpia los datos de edición
  };

  const handleAppointmentSaveSuccess = () => {
    fetchAppointmentAndActions(); // Vuelve a cargar los datos de la cita y sus acciones después de guardar
    handleCloseAppointmentFormModal(); // Cierra el modal
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  if (!appointment) {
    return <Alert severity="info" sx={{ m: 3 }}>Cita no encontrada.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/appointments')}
        sx={{ mb: 3 }}
      >
        Volver a Citas
      </Button>
      <Typography variant="h4" gutterBottom>
        Detalle de la Cita: con {appointment.lead ? appointment.lead.nombre : 'Lead Desconocido'}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Typography variant="body1">
            <strong>ID Cita:</strong> {appointment.id}
          </Typography>
          <Typography variant="body1">
            <strong>Lead Asociado:</strong> {appointment.lead ? appointment.lead.nombre : 'N/A'} ({appointment.lead ? appointment.lead.celular : 'N/A'})
            {/* Opcional: Botón para ir al detalle del Lead desde aquí */}
            {appointment.lead && (
                <Button size="small" onClick={() => navigate(`/leads/${appointment.lead.id}`)} sx={{ ml: 1 }}>
                    Ver Lead
                </Button>
            )}
          </Typography>
          <Typography variant="body1">
            <strong>Fecha y Hora:</strong> {moment(appointment.fecha_hora).format('DD/MM/YYYY HH:mm')}
          </Typography>
          <Typography variant="body1">
            <strong>Lugar:</strong> {appointment.lugar || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Estado:</strong> {appointment.estado}
          </Typography>
          <Typography variant="body1">
            <strong>Asesor Comercial:</strong> {appointment.asesor_comercial ? appointment.asesor_comercial.username : 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Asesor Presencial:</strong> {appointment.asesor_presencial ? appointment.asesor_presencial.username : 'N/A'}
          </Typography>
          <Typography variant="body1" sx={{ gridColumn: '1 / -1' }}>
            <strong>Observaciones:</strong> {appointment.observaciones || 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>Fecha de Creación:</strong> {moment(appointment.fecha_creacion).toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <strong>Última Actualización:</strong> {moment(appointment.ultima_actualizacion).toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<EditIcon />}
            onClick={handleOpenEditAppointmentModal}
          >
            Editar Cita
          </Button>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Historial de Acciones (Cita y Lead)
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        {actions.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No hay acciones registradas para esta cita o su lead.
          </Typography>
        ) : (
          <List>
            {actions.map((action, index) => (
              <React.Fragment key={action.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <>
                        <Typography
                          component="span"
                          variant="subtitle1"
                          color="textPrimary"
                        >
                          {action.tipo_accion}
                          {/* Opcional: Mostrar de qué objeto proviene la acción (Cita o Lead) */}
                          {action.appointment_details && (
                              <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                                (Cita ID: {action.appointment_details.id})
                              </Typography>
                          )}
                           {!action.appointment_details && action.lead && (
                              <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                                (Lead ID: {action.lead}) {/* action.lead aquí es el ID del lead, no el objeto completo */}
                              </Typography>
                          )}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textSecondary"
                          sx={{ ml: 1 }}
                        >
                          por {action.user ? action.user.username : 'Sistema'} el {moment(action.fecha_accion).toLocaleString()}
                        </Typography>
                      </>
                    }
                    secondary={action.detalle_accion}
                  />
                </ListItem>
                {index < actions.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* El modal de formulario de citas se renderiza aquí para la edición */}
      <AppointmentFormModal
        open={openAppointmentFormModal}
        onClose={handleCloseAppointmentFormModal}
        appointmentData={editingAppointmentData}
        onSaveSuccess={handleAppointmentSaveSuccess}
      />
    </Box>
  );
}

export default AppointmentDetailPage;