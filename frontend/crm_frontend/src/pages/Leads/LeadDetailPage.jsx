// frontend/crm_frontend/src/pages/Leads/LeadDetailPage.jsx
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
import leadsService from '../../services/leads';

function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        onClick={() => navigate('/leads')}
        sx={{ mb: 3 }}
      >
        Volver a Leads
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
            <strong>Proyecto:</strong> {lead.proyecto}
          </Typography>
          <Typography variant="body1">
            <strong>Celular:</strong> {lead.celular}
          </Typography>
          <Typography variant="body1">
            <strong>Medio:</strong> {lead.medio}
          </Typography>
          <Typography variant="body1">
            <strong>Distrito:</strong> {lead.distrito}
          </Typography>
          <Typography variant="body1">
            <strong>Tipificación:</strong> {lead.tipificacion}
          </Typography>
          <Typography variant="body1">
            <strong>Asesor:</strong> {lead.asesor ? lead.asesor.username : 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>OPC:</strong> {lead.opc || 'N/A'}
          </Typography>
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
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/leads/${lead.id}/edit`)}
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
    </Box>
  );
}

export default LeadDetailPage;