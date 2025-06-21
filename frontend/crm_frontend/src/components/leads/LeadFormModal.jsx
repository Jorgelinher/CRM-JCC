import React, { useEffect, useState, useCallback } from 'react';
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
  Autocomplete,
} from '@mui/material';
import leadsService from '../../services/leads';
import opcPersonnelService from '../../services/opcPersonnel';
import moment from 'moment'; // CORRECCIÓN: Importar moment

// Opciones de tipificación (mantener existentes)
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

const UBICACION_CHOICES = [
  { value: '', label: 'Seleccionar Ubicación' },
  { value: 'FERIA PLAZA NORTE', label: 'FERIA PLAZA NORTE' },
  { value: 'MODULO SJL', label: 'MODULO SJL' },
  { value: 'SJL - CANTO REY', label: 'SJL - CANTO REY' },
  { value: 'SJL', label: 'SJL' },
  { value: 'SJL - HACIENDA', label: 'SJL - HACIENDA' },
  { value: 'SJL - CHIMU', label: 'SJL - CHIMU' },
  { value: 'SJL - RENIEC', label: 'SJL - RENIEC' },
  { value: 'MINKA', label: 'MINKA' },
];

const PROYECTO_INTERES_CHOICES = [
  { value: '', label: 'Seleccionar Proyecto' },
  { value: 'OASIS 2 (AUCALLAMA)', label: 'OASIS 2 (AUCALLAMA)' },
  { value: 'OASIS 3 (HUACHO 2)', label: 'OASIS 3 (HUACHO 2)' },
  { value: 'OASIS 1 (HUACHO 1)', label: 'OASIS 1 (HUACHO 1)' },
  { value: 'OASIS 1 y 2', label: 'OASIS 1 y 2' },
  { value: 'OASIS 2 y 3', label: 'OASIS 2 y 3' },
  { value: 'OASIS 1 y 3', label: 'OASIS 1 y 3' },
  { value: 'OASIS 1,2 y 3', label: 'OASIS 1,2 y 3' },
];

const CALLE_MODULO_CHOICES = [
  { value: '', label: 'Seleccionar Tipo' },
  { value: 'CALLE', label: 'Calle' },
  { value: 'MODULO', label: 'Módulo' },
];


function LeadFormModal({ open, onClose, leadId, onSaveSuccess, isOPCContext = false }) {
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [asesores, setAsesores] = useState([]);
  const [opcPersonnelList, setOpcPersonnelList] = useState([]);
  const [opcSupervisorsList, setOpcSupervisorsList] = useState([]);
  const [asesorLoading, setAsesorLoading] = useState(false);
  const [asesorOptions, setAsesorOptions] = useState([]);
  const [asesorInput, setAsesorInput] = useState('');
  const [opcLoading, setOpcLoading] = useState(false);
  const [opcOptions, setOpcOptions] = useState([]);
  const [opcInput, setOpcInput] = useState('');
  const [supervisorOpcLoading, setSupervisorOpcLoading] = useState(false);
  const [supervisorOpcOptions, setSupervisorOpcOptions] = useState([]);
  const [supervisorOpcInput, setSupervisorOpcInput] = useState('');


  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      nombre: '', celular: '', ubicacion: '', medio: '', distrito: '',
      tipificacion: '', observacion: '', observacion_opc: '',
      asesor: '',
      personal_opc_captador: '', supervisor_opc_captador: '',
      fecha_captacion: '', calle_o_modulo: '', proyecto_interes: '',
    }
  });

  const watchedTipificacion = watch('tipificacion');
  const watchedPersonalOpcCaptadorId = watch('personal_opc_captador');
  const watchedMedioCaptacion = watch('medio');


  const fetchAsesores = useCallback(async () => {
    try {
      const data = await leadsService.getUsers({ page_size: 1000 });
      setAsesores(data.results || []);
    } catch (err) {
      console.error('Error fetching asesores:', err);
      setError('Error al cargar la lista de asesores.');
    }
  }, []);

  const fetchOpcPersonnel = useCallback(async () => {
    try {
        const allOpcPersonnelData = await opcPersonnelService.getPersonnel({ page_size: 1000 });
        const regularOpc = allOpcPersonnelData.results.filter(p => p.rol === 'OPC');
        const supervisors = allOpcPersonnelData.results.filter(p => p.rol === 'SUPERVISOR');

        setOpcPersonnelList(regularOpc || []);
        setOpcSupervisorsList(supervisors || []);
    } catch (err) {
        console.error('Error fetching OPC personnel for form:', err);
    }
  }, []);


  useEffect(() => {
    if (!open) {
      reset();
      setError('');
      setLoadingForm(true);
      return;
    }

    fetchAsesores();
    fetchOpcPersonnel();

    if (leadId) {
      const fetchLead = async () => {
        try {
          const leadData = await leadsService.getLeadById(leadId);
          reset({
            ...leadData,
            asesor: leadData.asesor ? leadData.asesor.id : '',
            tipificacion: (leadData.tipificacion && typeof leadData.tipificacion === 'string')
                                ? leadData.tipificacion.trim()
                                : '',
            personal_opc_captador: leadData.personal_opc_captador ? leadData.personal_opc_captador.id : '',
            supervisor_opc_captador: leadData.supervisor_opc_captador ? leadData.supervisor_opc_captador.id : '',
            fecha_captacion: leadData.fecha_captacion || '',
            calle_o_modulo: leadData.calle_o_modulo || '',
            ubicacion: leadData.ubicacion || '', // Asegurarse de que el campo ubicacion se preseleccione
            proyecto_interes: leadData.proyecto_interes || '', // Asegurarse de que el campo proyecto_interes se preseleccione
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
      // Lógica para nuevo lead
      const defaultValuesForNew = {
        nombre: '', celular: '', medio: '', distrito: '',
        tipificacion: '',
        observacion: '', observacion_opc: '',
        asesor: '',
        personal_opc_captador: '', supervisor_opc_captador: '',
        fecha_captacion: '', calle_o_modulo: '', proyecto_interes: '',
        ubicacion: '', // Valor por defecto
      };

      if (isOPCContext) {
        defaultValuesForNew.medio = 'Campo (Centros Comerciales)';
        defaultValuesForNew.fecha_captacion = moment().format('YYYY-MM-DD');
      }
      reset(defaultValuesForNew);
      setLoadingForm(false);
    }
  }, [open, leadId, reset, fetchAsesores, fetchOpcPersonnel, isOPCContext]);

  // Efecto para automatizar el supervisor al seleccionar Personal OPC
  useEffect(() => {
    if (watchedPersonalOpcCaptadorId) {
      const selectedOpc = opcPersonnelList.find(
        (p) => p.id === Number(watchedPersonalOpcCaptadorId)
      );
      if (selectedOpc && selectedOpc.supervisor) {
        setValue('supervisor_opc_captador', selectedOpc.supervisor);
      } else {
        setValue('supervisor_opc_captador', '');
      }
    } else {
      setValue('supervisor_opc_captador', '');
    }
  }, [watchedPersonalOpcCaptadorId, opcPersonnelList, setValue]);

  // Efecto para habilitar/deshabilitar campos OPC basado en Medio de Captación para leads generales
  const isMedioCampoCentrosComerciales = watchedMedioCaptacion === 'Campo (Centros Comerciales)';
  const shouldEnableOpcFields = isOPCContext || isMedioCampoCentrosComerciales;

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

  // Búsqueda asíncrona de personal OPC para el Autocomplete
  useEffect(() => {
    let active = true;
    // Si el input está vacío, cargar los primeros 10 OPC por defecto
    if (opcInput === '') {
      setOpcLoading(true);
      opcPersonnelService.getPersonnel({ page_size: 10 })
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
      return () => { active = false; };
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

  // Búsqueda asíncrona de supervisores OPC para el Autocomplete
  useEffect(() => {
    let active = true;
    if (supervisorOpcInput === '') {
      setSupervisorOpcOptions([]);
      return undefined;
    }
    setSupervisorOpcLoading(true);
    opcPersonnelService.getPersonnel({ search: supervisorOpcInput, page_size: 10, rol: 'SUPERVISOR' })
      .then(data => {
        if (active) {
          setSupervisorOpcOptions(data.results || []);
        }
      })
      .catch(() => {
        if (active) setSupervisorOpcOptions([]);
      })
      .finally(() => {
        if (active) setSupervisorOpcLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supervisorOpcInput]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');

    const payload = {
      ...data,
      asesor: data.asesor || null,
      personal_opc_captador: data.personal_opc_captador ? Number(data.personal_opc_captador) : null,
      supervisor_opc_captador: data.supervisor_opc_captador ? Number(data.supervisor_opc_captador) : null,
      fecha_captacion: data.fecha_captacion || null,
      ubicacion: data.ubicacion || null,
      proyecto_interes: data.proyecto_interes || null,
      calle_o_modulo: data.calle_o_modulo || null,
    };

    try {
      if (leadId) {
        await leadsService.updateLead(leadId, payload);
      } else {
        await leadsService.createLead(payload);
      }
      onSaveSuccess();
    } catch (err) {
      setError('Error al guardar el lead: ' + (err.response?.data?.celular || err.message || JSON.stringify(err.response?.data)));
      console.error('Error saving lead:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  // Determinar si los campos OPC deben ser de solo lectura/deshabilitados para leads ya existentes con OPC asignado
  const isOpcLeadAlreadyAssigned = !!leadId && !!watch('personal_opc_captador');


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
              {/* Información básica del Lead */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre Lead"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  {...register('nombre', { required: 'El nombre es requerido' })}
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                  InputLabelProps={{ shrink: true }}
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
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              {/* UBICACION (antes Proyecto) y PROYECTO DE INTERES */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.ubicacion}>
                  <InputLabel>Ubicación (Captación)</InputLabel>
                  <Select
                    label="Ubicación (Captación)"
                    value={watch('ubicacion') || ''}
                    {...register('ubicacion', { required: isOPCContext || shouldEnableOpcFields })}
                    disabled={!isOPCContext && !shouldEnableOpcFields}
                    InputLabelProps={{ shrink: true }}
                  >
                    {UBICACION_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.ubicacion && <Typography color="error" variant="caption">{errors.ubicacion.message}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.proyecto_interes}>
                  <InputLabel>Proyecto de Interés</InputLabel>
                  <Select
                    label="Proyecto de Interés"
                    value={watch('proyecto_interes') || ''}
                    {...register('proyecto_interes', { required: true })}
                    InputLabelProps={{ shrink: true }}
                  >
                    {PROYECTO_INTERES_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.proyecto_interes && <Typography color="error" variant="caption">{errors.proyecto_interes.message}</Typography>}
                </FormControl>
              </Grid>

              {/* Resto de campos Generales */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Medio de Captación</InputLabel>
                  <Select
                    label="Medio de Captación"
                    value={watch('medio') || ''}
                    {...register('medio')}
                    disabled={isOPCContext && !leadId}
                    InputLabelProps={{ shrink: true }}
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
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.tipificacion}>
                  <InputLabel>Tipificación</InputLabel>
                  <Select
                    label="Tipificación"
                    value={watchedTipificacion}
                    {...register('tipificacion')}
                  >
                    {TIPIFICACION_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={asesorOptions}
                  getOptionLabel={(option) => option.username ? `${option.username} (${option.first_name || ''} ${option.last_name || ''})` : ''}
                  loading={asesorLoading}
                  value={asesorOptions.find(opt => opt.id === Number(watch('asesor'))) || null}
                  onChange={(_, newValue) => setValue('asesor', newValue ? newValue.id : '')}
                  onInputChange={(_, newInput) => setAsesorInput(newInput)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Asesor"
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* CAMPOS OPC (visibles siempre, pero algunos readOnly/disabled condicionalmente) */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  options={opcOptions}
                  getOptionLabel={(option) => option.nombre || ''}
                  loading={opcLoading}
                  value={opcOptions.find(opt => opt.id === Number(watch('personal_opc_captador'))) || null}
                  onChange={(_, newValue) => setValue('personal_opc_captador', newValue ? newValue.id : '')}
                  onInputChange={(_, newInput) => setOpcInput(newInput)}
                  disabled={isOpcLeadAlreadyAssigned || !shouldEnableOpcFields}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Personal OPC Captador"
                      margin="normal"
                      error={!!errors.personal_opc_captador}
                      helperText={errors.personal_opc_captador?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  options={supervisorOpcOptions}
                  getOptionLabel={(option) => option.nombre || ''}
                  loading={supervisorOpcLoading}
                  value={supervisorOpcOptions.find(opt => opt.id === Number(watch('supervisor_opc_captador'))) || null}
                  onChange={(_, newValue) => setValue('supervisor_opc_captador', newValue ? newValue.id : '')}
                  onInputChange={(_, newInput) => setSupervisorOpcInput(newInput)}
                  disabled={true}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supervisor OPC Captador"
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Captación"
                  type="date"
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  {...register('fecha_captacion', { required: isOPCContext || shouldEnableOpcFields })}
                  readOnly={isOpcLeadAlreadyAssigned || !shouldEnableOpcFields}
                  disabled={isOpcLeadAlreadyAssigned || !shouldEnableOpcFields}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.calle_o_modulo}>
                  <InputLabel>Calle o Módulo</InputLabel>
                  <Select
                    label="Calle o Módulo"
                    value={watch('calle_o_modulo') || ''}
                    {...register('calle_o_modulo', { required: isOPCContext || shouldEnableOpcFields })}
                    disabled={isOpcLeadAlreadyAssigned || !shouldEnableOpcFields}
                    InputLabelProps={{ shrink: true }}
                  >
                    {CALLE_MODULO_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.calle_o_modulo && <Typography color="error" variant="caption">{errors.calle_o_modulo.message}</Typography>}
                </FormControl>
              </Grid>
              
              {/* Observaciones */}
              <Grid item xs={12}>
                <TextField
                  label="Observación General"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  {...register('observacion')}
                  InputLabelProps={{ shrink: true }}
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
                  InputLabelProps={{ shrink: true }}
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