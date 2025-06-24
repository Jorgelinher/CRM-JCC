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
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  InputAdornment,
  Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Tooltip, Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    ClearAll as ClearAllIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import appointmentsService from '../../services/appointments';
import leadsService from '../../services/leads';
import AppointmentFormModal from '../../components/appointments/AppointmentFormModal';

const localizer = momentLocalizer(moment);

const ESTADO_CITA_CHOICES = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Confirmada', label: 'Confirmada' },
  { value: 'Realizada', label: 'Realizada' },
  { value: 'Cancelada', 'label': 'Cancelada' },
  { value: 'Reprogramada', 'label': 'Reprogramada' },
];

function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [leads, setLeads] = useState([]);
  const [asesores, setAsesores] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFechaHoraDesde, setFilterFechaHoraDesde] = useState('');
  const [filterFechaHoraHasta, setFilterFechaHoraHasta] = useState('');

  const [viewMode, setViewMode] = useState('calendar');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalAppointments, setTotalAppointments] = useState(0);


  const fetchLeadsAndAsesores = useCallback(async () => {
    try {
      const [leadsData, asesoresData] = await Promise.all([
        leadsService.getLeads({ page_size: 1000, ordering: 'nombre' }),
        leadsService.getUsers({ page_size: 1000, ordering: 'username' }),
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
      const params = {
        search: searchTerm,
        page: page + 1,
        page_size: rowsPerPage,
        'fecha_hora_gte': filterFechaHoraDesde,
        'fecha_hora_lte': filterFechaHoraHasta,
        ordering: '-fecha_hora',
      };
      const data = await appointmentsService.getAppointments(params);
      setTotalAppointments(data.count || 0);

      const formattedAppointments = (data.results || []).map(app => ({
        ...app,
        title: `Cita con ${app.lead ? app.lead.nombre : 'Lead desconocido'} (${app.estado})`,
        start: new Date(app.fecha_hora),
        end: new Date(moment(app.fecha_hora).add(1, 'hour')),
      }));
      setAppointments(formattedAppointments);
    } catch (err) {
      setError('Error al cargar las citas.');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, rowsPerPage, filterFechaHoraDesde, filterFechaHoraHasta]);


  useEffect(() => {
    fetchLeadsAndAsesores();
    fetchAppointments();
  }, [fetchLeadsAndAsesores, fetchAppointments]);

  const handleSelectEvent = (event) => {
    navigate(`/appointments/${event.id}`);
  };

  const handleCreateNewAppointment = () => {
    setCurrentAppointment(null);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentAppointment(null);
    fetchAppointments();
  };

  const handleOpenEditAppointmentModal = (appointmentData) => {
    setCurrentAppointment(appointmentData);
    setOpenModal(true);
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      try {
        await appointmentsService.deleteAppointment(appointmentId);
        fetchAppointments();
      } catch (err) {
        setError('Error al eliminar la cita.');
        console.error('Error deleting appointment:', err);
      }
    }
  };

  const handleFilterFechaHoraDesdeChange = (event) => {
    setFilterFechaHoraDesde(event.target.value);
    setPage(0);
  };

  const handleFilterFechaHoraHastaChange = (event) => {
    setFilterFechaHoraHasta(event.target.value);
    setPage(0);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilterFechaHoraDesde('');
    setFilterFechaHoraHasta('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Citas
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Buscar por Lead (Nombre o Celular)"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {searchTerm ? (
                  <IconButton onClick={() => setSearchTerm('')} edge="end">
                    <ClearIcon />
                  </IconButton>
                ) : (
                  <SearchIcon />
                )}
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Fecha de Cita Desde"
          type="date"
          value={filterFechaHoraDesde}
          onChange={handleFilterFechaHoraDesdeChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Fecha de Cita Hasta"
          type="date"
          value={filterFechaHoraHasta}
          onChange={handleFilterFechaHoraHastaChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        <Button
          variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('calendar')}
        >
          Vista Calendario
        </Button>
        <Button
          variant={viewMode === 'list' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('list')}
        >
          Vista Tabla
        </Button>
        {(searchTerm || filterFechaHoraDesde || filterFechaHoraHasta) && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearAllIcon />}
            onClick={handleClearAllFilters}
          >
            Borrar Filtros
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNewAppointment}
          sx={{ ml: 'auto' }}
        >
          Agendar Nueva Cita
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
          {viewMode === 'calendar' && (
            <div style={{ height: 700 }}>
              <Calendar
                localizer={localizer}
                events={appointments}
                selectable
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleCreateNewAppointment}
                defaultView="week"
                views={['month', 'week', 'day']}
                startAccessor="start"
                endAccessor="end"
                culture="es"
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

          {viewMode === 'list' && (
            <Paper elevation={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#1A3578' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Lead</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Celular Lead</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Medio de Captación</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha y Hora</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Lugar</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Asesor Comercial</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Asesor Presencial</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No se encontraron citas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      appointments.map((appointment) => (
                        <TableRow key={appointment.id} hover>
                          <TableCell>{appointment.lead ? appointment.lead.nombre : 'N/A'}</TableCell>
                          <TableCell>{appointment.lead ? appointment.lead.celular : 'N/A'}</TableCell>
                          <TableCell>{appointment.lead ? appointment.lead.medio || 'N/A' : 'N/A'}</TableCell>
                          <TableCell>{new Date(appointment.fecha_hora).toLocaleString()}</TableCell>
                          <TableCell>{appointment.lugar}</TableCell>
                          <TableCell>
                            <Chip
                              label={appointment.estado}
                              size="small"
                              color={
                                appointment.estado === 'Confirmada' ? 'success' :
                                appointment.estado === 'Pendiente' ? 'warning' :
                                appointment.estado === 'Cancelada' ? 'error' :
                                appointment.estado === 'Realizada' ? 'primary' :
                                'default'
                              }
                              variant="filled"
                              sx={{ fontWeight: 'bold', color: 'white', backgroundColor:
                                appointment.estado === 'Confirmada' ? '#388e3c' :
                                appointment.estado === 'Pendiente' ? '#fbc02d' :
                                appointment.estado === 'Cancelada' ? '#d32f2f' :
                                appointment.estado === 'Realizada' ? '#1976d2' :
                                '#757575'
                              }}
                            />
                          </TableCell>
                          <TableCell>{appointment.asesor_comercial ? appointment.asesor_comercial.username : 'N/A'}</TableCell>
                          <TableCell>{appointment.asesor_presencial ? appointment.asesor_presencial.username : 'N/A'}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Ver Detalles">
                              <IconButton onClick={() => navigate(`/appointments/${appointment.id}`)}>
                                <ViewIcon color="info" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar Cita">
                              <IconButton onClick={() => handleOpenEditAppointmentModal(appointment)}>
                                <EditIcon color="warning" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar Cita">
                              <IconButton onClick={() => handleDeleteAppointment(appointment.id)}>
                                <DeleteIcon color="error" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalAppointments}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </Paper>
          )}
        </>
      )}

      <AppointmentFormModal
        open={openModal}
        onClose={handleCloseModal}
        appointmentData={currentAppointment}
        onSaveSuccess={handleCloseModal}
      />
    </Box>
  );
}

export default AppointmentsPage;