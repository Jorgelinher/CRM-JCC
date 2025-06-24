import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, FormControl, InputLabel, Select,
  CircularProgress, Alert, Typography, Box,
  Grid,
  Autocomplete,
} from '@mui/material';
import moment from 'moment';
import appointmentsService from '../../services/appointments';
import leadsService from '../../services/leads';
import opcPersonnelService from '../../services/opcPersonnel';

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

function AppointmentFormModal({ open, onClose, appointmentData, leadId, onSaveSuccess, opcPersonnelId }) {
    const [loadingForm, setLoadingForm] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [leads, setLeads] = useState([]);
    const [operators, setOperators] = useState([]);
    const [presentialAdvisors, setPresentialAdvisors] = useState([]);
    const [opcPersonnelList, setOpcPersonnelList] = useState([]);
    const [asesorLoading, setAsesorLoading] = useState(false);
    const [asesorOptions, setAsesorOptions] = useState([]);
    const [asesorInput, setAsesorInput] = useState('');
    const [leadLoading, setLeadLoading] = useState(false);
    const [leadOptions, setLeadOptions] = useState([]);
    const [leadInput, setLeadInput] = useState('');
    const [opcLoading, setOpcLoading] = useState(false);
    const [opcOptions, setOpcOptions] = useState([]);
    const [opcInput, setOpcInput] = useState('');
    const [leadInfo, setLeadInfo] = useState(null);

    const [formValues, setFormValues] = useState({
        lead_id: '',
        asesor_comercial_id: '',
        asesor_presencial_id: '',
        opc_personal_atendio_id: '',
        fecha_hora: '',
        lugar: '',
        estado: 'Pendiente',
        observaciones: '',
    });
    const [formErrors, setFormErrors] = useState({});

    const fetchSelectionsData = useCallback(async () => {
        try {
            const [leadsData, operatorsData, presentialData, opcData] = await Promise.all([
                leadsService.getLeads({ page_size: 1000, ordering: 'nombre' }),
                leadsService.getOperators({ page_size: 1000, ordering: 'username' }),
                leadsService.getPresentialAdvisors({ page_size: 1000, ordering: 'username' }),
                opcPersonnelService.getPersonnel({ page_size: 1000 }),
            ]);
            setLeads(leadsData.results || []);
            setOperators(operatorsData.results || []);
            setPresentialAdvisors(presentialData.results || []);
            setOpcPersonnelList(opcData.results || []);
        } catch (err) {
            setError('Error al cargar datos para el formulario de citas.');
            console.error('Error fetching selections data for appointment form:', err);
        }
    }, []);

    useEffect(() => {
        if (!open) {
            setFormValues({
                lead_id: '', asesor_comercial_id: '', asesor_presencial_id: '',
                opc_personal_atendio_id: '',
                fecha_hora: '', lugar: '', estado: 'Pendiente', observaciones: '',
            });
            setFormErrors({});
            setError('');
            setLoadingForm(true);
            return;
        }

        fetchSelectionsData();

        const initializeFormValues = async () => {
            if (appointmentData) {
                setFormValues({
                    lead_id: appointmentData.lead ? appointmentData.lead.id : '',
                    asesor_comercial_id: appointmentData.asesor_comercial ? appointmentData.asesor_comercial.id : '',
                    asesor_presencial_id: appointmentData.asesor_presencial ? appointmentData.asesor_presencial.id : '',
                    opc_personal_atendio_id: appointmentData.opc_personal_atendio ? appointmentData.opc_personal_atendio.id : '',
                    fecha_hora: moment(appointmentData.fecha_hora).format('YYYY-MM-DDTHH:mm'),
                    lugar: appointmentData.lugar || '',
                    estado: appointmentData.estado,
                    observaciones: appointmentData.observaciones || '',
                });
            } else {
                setFormValues({
                    lead_id: leadId || '',
                    asesor_comercial_id: '',
                    asesor_presencial_id: '',
                    opc_personal_atendio_id: opcPersonnelId || '',
                    fecha_hora: moment().format('YYYY-MM-DDTHH:mm'),
                    lugar: '',
                    estado: 'Pendiente',
                    observaciones: '',
                });
            }
            setLoadingForm(false);
        };
        initializeFormValues();
    }, [open, appointmentData, leadId, opcPersonnelId, fetchSelectionsData]);

    // Búsqueda asíncrona de asesores para el Autocomplete
    useEffect(() => {
        let active = true;
        if (asesorInput === '') {
            setAsesorOptions([]);
            return undefined;
        }
        setAsesorLoading(true);
        leadsService.getUsers({ search: asesorInput, page_size: 10, ordering: 'username' })
            .then(data => {
                if (active) {
                    setAsesorOptions(data.results || []);
                }
            })
            .catch(() => {
                if (active) setAsesorOptions([]);
            })
            .finally(() => {
                if (active) setAsesorLoading(false);
            });
        return () => {
            active = false;
        };
    }, [asesorInput]);

    // Búsqueda asíncrona de leads para el Autocomplete
    useEffect(() => {
        let active = true;
        if (leadInput === '') {
            setLeadOptions([]);
            return undefined;
        }
        setLeadLoading(true);
        leadsService.getLeads({ search: leadInput, page_size: 10, ordering: 'nombre' })
            .then(data => {
                if (active) {
                    setLeadOptions(data.results || []);
                }
            })
            .catch(() => {
                if (active) setLeadOptions([]);
            })
            .finally(() => {
                if (active) setLeadLoading(false);
            });
        return () => {
            active = false;
        };
    }, [leadInput]);

    // Búsqueda asíncrona de personal OPC para el Autocomplete
    useEffect(() => {
        let active = true;
        if (opcInput === '') {
            setOpcOptions([]);
            return undefined;
        }
        setOpcLoading(true);
        opcPersonnelService.getPersonnel({ search: opcInput, page_size: 10 })
            .then(data => {
                if (active) {
                    setOpcOptions(data.results || []);
                }
            })
            .catch(() => {
                if (active) setOpcOptions([]);
            })
            .finally(() => {
                if (active) setOpcLoading(false);
            });
        return () => {
            active = false;
        };
    }, [opcInput]);

    // Obtener info del lead si leadId está presente
    useEffect(() => {
        if ((leadId || formValues.lead_id) && !appointmentData) {
            const id = leadId || formValues.lead_id;
            leadsService.getLeadById(id).then(setLeadInfo).catch(() => setLeadInfo(null));
        } else if (appointmentData && appointmentData.lead) {
            setLeadInfo(appointmentData.lead);
        }
    }, [leadId, formValues.lead_id, appointmentData]);

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
        if (!formValues.asesor_comercial_id && !formValues.asesor_presencial_id && !formValues.opc_personal_atendio_id) {
            errors.atencion = 'Debe asignar al menos un Operador o Personal OPC de atención.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);
        setError('');
        try {
            let asesorComercialId = formValues.asesor_comercial_id;
            // Si no se seleccionó asesor comercial ni presencial, pero el lead tiene asesor asignado, usarlo
            if (!asesorComercialId && !formValues.asesor_presencial_id && leadInfo && leadInfo.asesor) {
                asesorComercialId = leadInfo.asesor.id;
            }
            const finalPayload = {
                lead_id: Number(formValues.lead_id),
                asesor_comercial_id: asesorComercialId ? Number(asesorComercialId) : null,
                asesor_presencial_id: formValues.asesor_presencial_id ? Number(formValues.asesor_presencial_id) : null,
                opc_personal_atendio_id: formValues.opc_personal_atendio_id ? Number(formValues.opc_personal_atendio_id) : null,
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
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Autocomplete
                                    fullWidth
                                    options={leadOptions}
                                    getOptionLabel={(option) => option.nombre ? `${option.nombre} (${option.celular || ''})` : ''}
                                    loading={leadLoading}
                                    value={leadOptions.find(opt => opt.id === formValues.lead_id) || leadInfo || null}
                                    onChange={(_, newValue) => {
                                        setFormValues(prev => ({ ...prev, lead_id: newValue ? newValue.id : '' }));
                                        setFormErrors(prev => ({ ...prev, lead_id: '' }));
                                    }}
                                    onInputChange={(_, newInput) => setLeadInput(newInput)}
                                    disabled={!!appointmentData || !!leadId}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Lead"
                                            margin="normal"
                                            error={!!formErrors.lead_id}
                                            helperText={formErrors.lead_id}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {leadLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
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
                                        InputLabelProps={{ shrink: true }}
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
                                <Autocomplete
                                    fullWidth
                                    options={operators}
                                    getOptionLabel={(option) => option.username || ''}
                                    loading={asesorLoading}
                                    value={operators.find(opt => opt.id === formValues.asesor_comercial_id) || null}
                                    onChange={(_, newValue) => {
                                        setFormValues(prev => ({ ...prev, asesor_comercial_id: newValue ? newValue.id : '' }));
                                        setFormErrors(prev => ({ ...prev, asesor_comercial_id: '' }));
                                    }}
                                    onInputChange={(_, newInput) => setAsesorInput(newInput)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Operador"
                                            margin="normal"
                                            helperText="Selecciona el operador responsable de la gestión."
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {asesorLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    fullWidth
                                    options={presentialAdvisors}
                                    getOptionLabel={(option) => option.username || ''}
                                    loading={asesorLoading}
                                    value={presentialAdvisors.find(opt => opt.id === formValues.asesor_presencial_id) || null}
                                    onChange={(_, newValue) => {
                                        setFormValues(prev => ({ ...prev, asesor_presencial_id: newValue ? newValue.id : '' }));
                                        setFormErrors(prev => ({ ...prev, asesor_presencial_id: '' }));
                                    }}
                                    onInputChange={(_, newInput) => setAsesorInput(newInput)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Asesor Presencial"
                                            margin="normal"
                                            helperText="Selecciona el asesor presencial que atenderá la cita."
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {asesorLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Autocomplete
                                    fullWidth
                                    options={opcOptions}
                                    getOptionLabel={(option) => option.nombre ? `${option.nombre} (${option.rol || ''})` : ''}
                                    loading={opcLoading}
                                    value={opcOptions.find(opt => opt.id === formValues.opc_personal_atendio_id) || null}
                                    onChange={(_, newValue) => {
                                        setFormValues(prev => ({ ...prev, opc_personal_atendio_id: newValue ? newValue.id : '' }));
                                        setFormErrors(prev => ({ ...prev, opc_personal_atendio_id: '' }));
                                    }}
                                    onInputChange={(_, newInput) => setOpcInput(newInput)}
                                    disabled={leadInfo && !leadInfo.es_directeo}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Personal OPC (Atención Directa)"
                                            margin="normal"
                                            error={!!formErrors.atencion}
                                            helperText={formErrors.atencion}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {opcLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Estado de la Cita</InputLabel>
                                    <Select
                                        name="estado"
                                        label="Estado de la Cita"
                                        value={formValues.estado}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
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
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
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