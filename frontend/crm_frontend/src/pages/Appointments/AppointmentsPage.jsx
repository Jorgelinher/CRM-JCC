// frontend/crm_frontend/src/pages/Appointments/AppointmentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import appointmentsService from '../../services/appointments';
import leadsService from '../../services/leads'; // Para obtener leads y asesores para los selectores

const localizer = momentLocalizer(moment);

// Opciones de estado de cita (debe coincidir con tu modelo de Django)
const ESTADO_CITA_CHOICES = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Confirmada', label: 'Confirmada' },
  { value: 'Realizada', label: 'Realizada' },
  { value: 'Cancelada', label: 'Cancelada' },
  { value: 'Reprogramada', label: 'Reprogramada' },
];

function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null); // Para editar
  const [leads, setLeads] = useState([]); // Lista de leads para selector
  const [asesores, setAsesores] = useState([]); // Lista de asesores para selector

  // Estado del formulario de cita
  const [formValues, setFormValues] = useState({
    lead_id: '',
    asesor_comercial_id: '',
    asesor_presencial_id: '',
    fecha_hora: '',
    lugar: '',
    estado: 'Pendiente',
    observaciones: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchLeadsAndAsesores = useCallback(async () => {
    try {
      const [leadsData, asesoresData] = await Promise.all([
        leadsService.getLeads({ page_size: 1000, ordering: 'nombre' }), // Obtener todos los leads
        leadsService.getUsers({ page_size: 1000, ordering: 'username' }), // Obtener todos los asesores
      ]);
      setLeads(leadsData.results || []);
      setAsesores(asesoresData.results || []);
    } catch (err) {
      console.error('Error fetching leads or asesores for form:', err);
      setError('Error al cargar datos para el formulario de citas.');
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await appointmentsService.getAppointments({ ordering: '-fecha_hora' });
      // Mapear los datos de la API al formato que react-big-calendar espera
        const formattedAppointments = (data.results || []).map(app => ({
        ...app,
        title: `Cita con ${app.lead ? app.lead.nombre : 'Lead desconocido'} (${app.estado})`,
        start: new Date(app.fecha_hora),
        end: new Date(moment(app.fecha_hora).add(1, 'hour')), // Asume 1 hora de duración por defecto
      }));
      setAppointments(formattedAppointments);
    } catch (err) {
      setError('Error al cargar las citas.');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadsAndAsesores();
    fetchAppointments();
  }, [fetchLeadsAndAsesores, fetchAppointments]);

  const handleSelectEvent = (event) => {
    // Cuando seleccionas una cita existente
    setCurrentAppointment(event);
    setFormValues({
      lead_id: event.lead ? event.lead.id : '',
      asesor_comercial_id: event.asesor_comercial ? event.asesor_comercial.id : '',
      asesor_presencial_id: event.asesor_presencial ? event.asesor_presencial.id : '',
      fecha_hora: moment(event.fecha_hora).format('YYYY-MM-DDTHH:mm'), // Formato para input datetime-local
      lugar: event.lugar || '',
      estado: event.estado,
      observaciones: event.observaciones || '',
    });
    setOpenModal(true);
  };

  const handleSelectSlot = ({ start, end }) => {
    // Cuando seleccionas un espacio en el calendario para crear una nueva cita
    setCurrentAppointment(null); // Es una nueva cita
    setFormValues({
      lead_id: '',
      asesor_comercial_id: '',
      asesor_presencial_id: '',
      fecha_hora: moment(start).format('YYYY-MM-DDTHH:mm'), // Pre-llenar fecha/hora
      lugar: '',
      estado: 'Pendiente',
      observaciones: '',
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentAppointment(null);
    setFormValues({ // Resetear formulario
      lead_id: '', asesor_comercial_id: '', asesor_presencial_id: '',
      fecha_hora: '', lugar: '', estado: 'Pendiente', observaciones: '',
    });
    setFormErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let errors = {};
    if (!formValues.lead_id) errors.lead_id = 'El lead es requerido.';
    if (!formValues.fecha_hora) errors.fecha_hora = 'La fecha y hora son requeridas.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setError('');
    try {
      const payload = {
        ...formValues,
        // Asegúrate de que los IDs sean números o null si no se seleccionan
        lead_id: formValues.lead_id ? Number(formValues.lead_id) : null,
        asesor_comercial_id: formValues.asesor_comercial_id ? Number(formValues.asesor_comercial_id) : null,
        asesor_presencial_id: formValues.asesor_presencial_id ? Number(formValues.asesor_presencial_id) : null,
        fecha_hora: moment(formValues.fecha_hora).toISOString(), // Convertir a formato ISO para Django
      };

      if (currentAppointment) {
        await appointmentsService.updateAppointment(currentAppointment.id, payload);
      } else {
        await appointmentsService.createAppointment(payload);
      }
      fetchAppointments(); // Recargar citas
      handleCloseModal();
    } catch (err) {
      setError('Error al guardar la cita: ' + (err.response?.data?.detail || err.message));
      console.error('Error saving appointment:', err);
    }
  };

  const handleDelete = async () => {
    if (!currentAppointment || !window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      return;
    }
    setError('');
    try {
      await appointmentsService.deleteAppointment(currentAppointment.id);
      fetchAppointments();
      handleCloseModal();
    } catch (err) {
      setError('Error al eliminar la cita: ' + (err.response?.data?.detail || err.message));
      console.error('Error deleting appointment:', err);
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Citas
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })} // Abrir modal para nueva cita
        sx={{ mb: 3 }}
      >
        Agendar Nueva Cita
      </Button>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <div style={{ height: 700 }}>
          <Calendar
            localizer={localizer}
            events={appointments}
            selectable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            defaultView="week"
            views={['month', 'week', 'day']}
            startAccessor="start"
            endAccessor="end"
            culture="es" // Para que los nombres de los días y meses sean en español
            messages={{
              allDay: 'Todo el día',
              previous: 'Anterior',
              next: 'Siguiente',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'No hay citas en este rango.',
              showMore: total => `+ ${total} más`,
            }}
          />
        </div>
      )}

      {/* Modal para Crear/Editar Citas */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>{currentAppointment ? 'Editar Cita' : 'Agendar Nueva Cita'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
          <FormControl fullWidth margin="normal" error={!!formErrors.lead_id}>
            <InputLabel>Lead</InputLabel>
            <Select
              name="lead_id"
              label="Lead"
              value={formValues.lead_id}
              onChange={handleChange}
            >
              <MenuItem value=""><em>Seleccione un Lead</em></MenuItem>
              {leads.map((lead) => (
                <MenuItem key={lead.id} value={lead.id}>
                  {lead.nombre} ({lead.celular})
                </MenuItem>
              ))}
            </Select>
            {formErrors.lead_id && <Typography color="error" variant="caption">{formErrors.lead_id}</Typography>}
          </FormControl>

          <TextField
            label="Fecha y Hora"
            type="datetime-local"
            name="fecha_hora"
            value={formValues.fecha_hora}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            error={!!formErrors.fecha_hora}
            helperText={formErrors.fecha_hora}
          />
          <TextField
            label="Lugar"
            name="lugar"
            value={formValues.lugar}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Asesor Comercial</InputLabel>
            <Select
              name="asesor_comercial_id"
              label="Asesor Comercial"
              value={formValues.asesor_comercial_id}
              onChange={handleChange}
            >
              <MenuItem value=""><em>(Automático o Seleccionar)</em></MenuItem>
              {asesores.map((asesor) => (
                <MenuItem key={asesor.id} value={asesor.id}>
                  {asesor.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Asesor Presencial</InputLabel>
            <Select
              name="asesor_presencial_id"
              label="Asesor Presencial"
              value={formValues.asesor_presencial_id}
              onChange={handleChange}
            >
              <MenuItem value=""><em>(Seleccionar)</em></MenuItem>
              {asesores.map((asesor) => (
                <MenuItem key={asesor.id} value={asesor.id}>
                  {asesor.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Estado de la Cita</InputLabel>
            <Select
              name="estado"
              label="Estado de la Cita"
              value={formValues.estado}
              onChange={handleChange}
            >
              {ESTADO_CITA_CHOICES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Observaciones"
            name="observaciones"
            value={formValues.observaciones}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          {currentAppointment && (
            <Button onClick={handleDelete} color="error">
              Eliminar
            </Button>
          )}
          <Button onClick={handleCloseModal} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {currentAppointment ? 'Actualizar' : 'Agendar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AppointmentsPage;