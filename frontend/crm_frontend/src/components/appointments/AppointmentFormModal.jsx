// frontend/crm_frontend/src/components/appointments/AppointmentFormModal.jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, FormControl, InputLabel, Select,
  CircularProgress, Alert, Typography, Box,
  Grid, // NUEVO: Importar Grid
} from '@mui/material';
import moment from 'moment';
import appointmentsService from '../../services/appointments';
import leadsService from '../../services/leads';

const ESTADO_CITA_CHOICES = [
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Confirmada', label: 'Confirmada' },
    { value: 'Realizada', label: 'Realizada' },
    { value: 'Cancelada', label: 'Cancelada' },
    { value: 'Reprogramada', label: 'Reprogramada' },
];

const UBICACION_CHOICES = [
    { value: '', label: 'Seleccione Ubicación' },
    { value: 'Sala Lince', label: 'Sala Lince' },
    { value: 'Sala Los Olivos', label: 'Sala Los Olivos' },
    { value: 'Evento Rikoton', label: 'Evento Rikoton' },
    { value: 'Evento Beguis', label: 'Evento Beguis' },
    { value: 'Proyecto', label: 'Proyecto' },
];

function AppointmentFormModal({ open, onClose, appointmentData, leadId, onSaveSuccess }) {
    const [loadingForm, setLoadingForm] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [leads, setLeads] = useState([]);
    const [asesores, setAsesores] = useState([]);

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

    useEffect(() => {
        if (!open) {
            setFormValues({
                lead_id: '', asesor_comercial_id: '', asesor_presencial_id: '',
                fecha_hora: '', lugar: '', estado: 'Pendiente', observaciones: '',
            });
            setFormErrors({});
            setError('');
            setLoadingForm(true);
            return;
        }

        const fetchData = async () => {
            try {
                const [leadsData, asesoresData] = await Promise.all([
                    leadsService.getLeads({ page_size: 1000, ordering: 'nombre' }),
                    leadsService.getUsers({ page_size: 1000, ordering: 'username' }),
                ]);
                setLeads(leadsData.results || []);
                setAsesores(asesoresData.results || []);

                if (appointmentData) {
                    setFormValues({
                        lead_id: appointmentData.lead ? appointmentData.lead.id : '',
                        asesor_comercial_id: appointmentData.asesor_comercial ? appointmentData.asesor_comercial.id : '',
                        asesor_presencial_id: appointmentData.asesor_presencial ? appointmentData.asesor_presencial.id : '',
                        fecha_hora: moment(appointmentData.fecha_hora).format('YYYY-MM-DDTHH:mm'),
                        lugar: appointmentData.lugar || '',
                        estado: appointmentData.estado,
                        observaciones: appointmentData.observaciones || '',
                    });
                } else if (leadId) {
                    setFormValues(prev => ({
                        ...prev,
                        lead_id: leadId,
                        fecha_hora: moment().format('YYYY-MM-DDTHH:mm'),
                    }));
                } else {
                    setFormValues(prev => ({
                        ...prev,
                        fecha_hora: moment().format('YYYY-MM-DDTHH:mm'),
                    }));
                }
            } catch (err) {
                setError('Error al cargar datos para el formulario de citas.');
                console.error('Error fetching data for appointment form:', err);
            } finally {
                setLoadingForm(false);
            }
        };
        fetchData();
    }, [open, appointmentData, leadId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
        setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        let errors = {};
        if (!formValues.lead_id) errors.lead_id = 'El lead es requerido.';
        if (!formValues.fecha_hora) errors.fecha_hora = 'La fecha y hora son requeridas.';
        if (!formValues.lugar) errors.lugar = 'El lugar es requerido.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        setError('');

        try {
            const finalPayload = {
                lead_id: Number(formValues.lead_id),
                asesor_comercial_id: formValues.asesor_comercial_id ? Number(formValues.asesor_comercial_id) : null,
                asesor_presencial_id: formValues.asesor_presencial_id ? Number(formValues.asesor_presencial_id) : null,
                fecha_hora: moment(formValues.fecha_hora).toISOString(),
                lugar: formValues.lugar,
                estado: formValues.estado,
                observaciones: formValues.observaciones,
            };

            if (appointmentData) {
                await appointmentsService.updateAppointment(appointmentData.id, finalPayload);
            } else {
                await appointmentsService.createAppointment(finalPayload);
            }
            onSaveSuccess();
        } catch (err) {
            setError('Error al guardar la cita: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message));
            console.error('Error saving appointment:', err.response?.data || err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!appointmentData || !window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await appointmentsService.deleteAppointment(appointmentData.id);
            onSaveSuccess();
        } catch (err) {
            setError('Error al eliminar la cita: ' + (err.response?.data?.detail || err.message));
            console.error('Error deleting appointment:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{appointmentData ? 'Editar Cita' : 'Agendar Nueva Cita'}</DialogTitle>
            <DialogContent dividers>
                {loadingForm ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <form>
                        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                        <Grid container spacing={2}> {/* Contenedor Grid para el formulario */}
                            <Grid item xs={12}>
                                <FormControl fullWidth margin="normal"> {/* margin="normal" se puede quitar si el spacing del Grid es suficiente */}
                                    <InputLabel>Lead</InputLabel>
                                    <Select
                                        name="lead_id"
                                        label="Lead"
                                        value={formValues.lead_id}
                                        onChange={handleChange}
                                        disabled={!!appointmentData || !!leadId}
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
                            </Grid>
                            <Grid item xs={12} sm={6}>
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
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth margin="normal" error={!!formErrors.lugar}>
                                    <InputLabel>Ubicación</InputLabel>
                                    <Select
                                        name="lugar"
                                        label="Ubicación"
                                        value={formValues.lugar}
                                        onChange={handleChange}
                                    >
                                        {UBICACION_CHOICES.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {formErrors.lugar && <Typography color="error" variant="caption">{formErrors.lugar}</Typography>}
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
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
                            </Grid>
                            <Grid item xs={12} sm={6}>
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
                            </Grid>
                            <Grid item xs={12}>
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
                            </Grid>
                            <Grid item xs={12}>
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
                            </Grid>
                        </Grid> {/* Fin Contenedor Grid */}
                    </form>
                )}
            </DialogContent>
            <DialogActions>
                {appointmentData && (
                    <Button onClick={handleDelete} color="error" disabled={submitting}>
                        Eliminar
                    </Button>
                )}
                <Button onClick={onClose} color="secondary" disabled={submitting}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} color="primary" variant="contained" disabled={submitting}>
                    {submitting ? <CircularProgress size={24} /> : (appointmentData ? 'Actualizar' : 'Agendar')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AppointmentFormModal;