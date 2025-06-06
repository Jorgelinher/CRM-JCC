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
              
              {/* UBICACION (antes Proyecto) y PROYECTO DE INTERES */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.ubicacion}>
                  <InputLabel>Ubicación (Captación)</InputLabel>
                  <Select
                    label="Ubicación (Captación)"
                    value={watch('ubicacion') || ''}
                    {...register('ubicacion', { required: isOPCContext || shouldEnableOpcFields })}
                    disabled={!isOPCContext && !shouldEnableOpcFields}
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
                    value={watchedTipificacion}
                    {...register('tipificacion', { required: !isOPCContext })}
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

              {/* CAMPOS OPC (visibles siempre, pero algunos readOnly/disabled condicionalmente) */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Personal OPC Captador</InputLabel>
                  <Select
                    label="Personal OPC Captador"
                    value={watch('personal_opc_captador') || ''}
                    {...register('personal_opc_captador', { required: isOPCContext || shouldEnableOpcFields })}
                    disabled={isOpcLeadAlreadyAssigned || !shouldEnableOpcFields}
                  >
                    <MenuItem value="">Sin asignar OPC</MenuItem>
                    {opcPersonnelList.map((opc) => (
                      <MenuItem key={opc.id} value={opc.id}>
                        {opc.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.personal_opc_captador && <Typography color="error" variant="caption">{errors.personal_opc_captador.message}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" disabled={true}>
                  <InputLabel>Supervisor OPC Captador</InputLabel>
                  <Select
                    label="Supervisor OPC Captador"
                    value={watchedPersonalOpcCaptadorId ? (
                        opcPersonnelList.find(p => p.id === Number(watchedPersonalOpcCaptadorId))?.supervisor || ''
                    ) : ''}
                    {...register('supervisor_opc_captador')}
                  >
                    <MenuItem value="">Sin Supervisor</MenuItem>
                    {opcSupervisorsList.map((sup) => (
                      <MenuItem key={sup.id} value={sup.id}>
                        {sup.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                {errors.fecha_captacion && <Typography color="error" variant="caption">{errors.fecha_captacion.message}</Typography>}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.calle_o_modulo}>
                  <InputLabel>Calle o Módulo</InputLabel>
                  <Select
                    label="Calle o Módulo"
                    value={watch('calle_o_modulo') || ''}
                    {...register('calle_o_modulo', { required: isOPCContext || shouldEnableOpcFields })}
                    disabled={isOpcLeadAlreadyAssigned || !shouldEnableOpcFields}
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