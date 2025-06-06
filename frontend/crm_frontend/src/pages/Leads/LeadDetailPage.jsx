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
import { Edit as EditIcon, ArrowBack as ArrowBackIcon, Event as EventIcon } from '@mui/icons-material';
import leadsService from '../../services/leads';
import LeadFormModal from '../../components/leads/LeadFormModal';
import AppointmentFormModal from '../../components/appointments/AppointmentFormModal';
import useAuth from '../../hooks/useAuth';

// Las tipificaciones que habilitan el botón de "Agendar Cita"
const CITA_TIPIFICATIONS = [
  'CITA - SALA',
  'CITA - PROYECTO',
  'CITA - HxH',
  'CITA - ZOOM',
  'CITA - POR CONFIRMAR'
];

function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [openLeadFormModal, setOpenLeadFormModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);

  const [openAppointmentModal, setOpenAppointmentModal] = useState(false);
  const [opcPersonnelIdForAppointment, setOpcPersonnelIdForAppointment] = useState(null);


  const fetchLeadAndActions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const leadData = await leadsService.getLeadById(id);
      setLead(leadData);

      const actionsData = await leadsService.getLeadActions(id);
      setActions(actionsData);
    } catch (err) {
      setError('Error al cargar los detalles del lead o sus acciones.');
      console.error('Error fetching lead details or actions:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadAndActions();
  }, [fetchLeadAndActions]);

  const handleOpenEditLeadModal = () => {
    setEditingLeadId(lead.id);
    setOpenLeadFormModal(true);
  };

  const handleCloseLeadFormModal = () => {
    setOpenLeadFormModal(false);
  };

  const handleLeadSaveSuccess = () => {
    fetchLeadAndActions();
    handleCloseLeadFormModal();
  };

  const handleOpenAppointmentModal = () => {
    if (user && user.opc_profile_id && lead && lead.personal_opc_captador && user.opc_profile_id === lead.personal_opc_captador.id) {
        setOpcPersonnelIdForAppointment(user.opc_profile_id);
    } else {
        setOpcPersonnelIdForAppointment(null);
    }
    setOpenAppointmentModal(true);
  };

  const handleCloseAppointmentModal = () => {
    setOpenAppointmentModal(false);
    setOpcPersonnelIdForAppointment(null);
    fetchLeadAndActions();
  };

  const handleAppointmentSaveSuccess = () => {
    handleCloseAppointmentModal();
    fetchLeadAndActions();
  };

  const shouldShowScheduleButton = lead && CITA_TIPIFICATIONS.includes(lead.tipificacion);
  const isOPCManaging = shouldShowScheduleButton && user && user.opc_profile_id && lead && lead.personal_opc_captador && user.opc_profile_id === lead.personal_opc_captador.id;

  const isOpcLead = lead ? !!lead.personal_opc_captador_details : false;
  const returnPath = isOpcLead ? '/opc-leads' : '/leads';


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

  if (!lead) {
    return <Alert severity="info" sx={{ m: 3 }}>Lead no encontrado.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(returnPath)}
        sx={{ mb: 3 }}
      >
        Volver a {isOpcLead ? "Leads OPC" : "Leads"}
      </Button>
      <Typography variant="h4" gutterBottom>
        Detalle del Lead: {lead.nombre}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Typography variant="body1">
            <strong>ID:</strong> {lead.id}
          </Typography>
          <Typography variant="body1">
            <strong>Ubicación:</strong> {lead.ubicacion || 'N/A'}{/* CAMPO ACTUALIZADO */}
          </Typography>
          <Typography variant="body1">
            <strong>Proyecto de Interés:</strong> {lead.proyecto_interes || 'N/A'}{/* NUEVO CAMPO */}
          </Typography>
          <Typography variant="body1">
            <strong>Celular:</strong> {lead.celular}
          </Typography>
          <Typography variant="body1">
            <strong>Medio:</strong> {lead.medio || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Distrito:</strong> {lead.distrito || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Tipificación:</strong> {lead.tipificacion || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Asesor:</strong> {lead.asesor ? lead.asesor.username : 'N/A'}
          </Typography>
          {isOpcLead && (
            <>
              <Typography variant="body1">
                <strong>Personal OPC Captador:</strong> {lead.personal_opc_captador_details?.nombre || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Supervisor OPC Captador:</strong> {lead.supervisor_opc_captador_details?.nombre || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Fecha Captación:</strong> {lead.fecha_captacion || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Calle o Módulo:</strong> {lead.calle_o_modulo || 'N/A'}
              </Typography>
            </>
          )}
          <Typography variant="body1" sx={{ gridColumn: '1 / -1' }}>
            <strong>Observación:</strong> {lead.observacion || 'N/A'}
          </Typography>
          <Typography variant="body1" sx={{ gridColumn: '1 / -1' }}>
            <strong>Observación OPC:</strong> {lead.observacion_opc || 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>Fecha de Creación:</strong> {new Date(lead.fecha_creacion).toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <strong>Última Actualización:</strong> {new Date(lead.ultima_actualizacion).toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {shouldShowScheduleButton && (
            <Button
              variant="contained"
              color={isOPCManaging ? "secondary" : "success"}
              startIcon={<EventIcon />}
              onClick={handleOpenAppointmentModal}
            >
              {isOPCManaging ? "Agendar Cita (OPC)" : "Agendar Cita"}
            </Button>
          )}
          <Button
            variant="contained"
            color="warning"
            startIcon={<EditIcon />}
            onClick={handleOpenEditLeadModal}
          >
            Editar Lead
          </Button>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Historial de Acciones
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        {actions.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No hay acciones registradas para este lead.
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
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textSecondary"
                          sx={{ ml: 1 }}
                        >
                          por {action.user ? action.user.username : 'Sistema'} el {new Date(action.fecha_accion).toLocaleString()}
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

      <LeadFormModal
        open={openLeadFormModal}
        onClose={handleCloseLeadFormModal}
        leadId={editingLeadId}
        onSaveSuccess={handleLeadSaveSuccess}
        isOPCContext={isOpcLead}
      />
      <AppointmentFormModal
        open={openAppointmentModal}
        onClose={handleCloseAppointmentModal}
        leadId={lead.id}
        opcPersonnelId={opcPersonnelIdForAppointment}
        onSaveSuccess={handleAppointmentSaveSuccess}
      />
    </Box>
  );
}

export default LeadDetailPage;