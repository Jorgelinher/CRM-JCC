import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  TablePagination,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  ClearAll as ClearAllIcon,
  SwapHoriz as ReassignIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import leadsService from '../../services/leads';
import metricsService from '../../services/metrics';
import LeadFormModal from '../../components/leads/LeadFormModal';

const TIPIFICACION_CHOICES = [
  { value: '', label: 'Todas las Tipificaciones' },
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

function LeadsPage() {
  console.log('LeadsPage: Componente renderizado');

  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipificacion, setFilterTipificacion] = useState('');
  const [filterAsesor, setFilterAsesor] = useState('');
  const [filterFechaCreacionDesde, setFilterFechaCreacionDesde] = useState('');
  const [filterFechaCreacionHasta, setFilterFechaCreacionHasta] = useState('');
  const [asesores, setAsesores] = useState([]);

  const [openLeadFormModal, setOpenLeadFormModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLeads, setTotalLeads] = useState(0);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [openReassignModal, setOpenReassignModal] = useState(false);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState('');
  const [reassignSuccess, setReassignSuccess] = useState('');
  const [newAsesor, setNewAsesor] = useState(null);

  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    console.log('fetchLeads: Iniciando llamada a la API de leads con parámetros (paginación real)');
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        search: searchTerm,
        tipificacion: filterTipificacion,
        asesor: filterAsesor,
        'fecha_creacion_after': filterFechaCreacionDesde,
        'fecha_creacion_before': filterFechaCreacionHasta,
        ordering: '-fecha_creacion',
      };

      const response = await leadsService.getLeadsGestion(params);
      console.log('fetchLeads: Datos de leads recibidos (paginados):', response);

      setLeads(response.results || []);
      setTotalLeads(response.count || 0);

    } catch (err) {
      console.error('fetchLeads: Error al cargar los leads:', err);
      setError('Error al cargar los leads.');
      setLeads([]);
      setTotalLeads(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterTipificacion, filterAsesor, filterFechaCreacionDesde, filterFechaCreacionHasta]);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const params = {
        asesor_id: filterAsesor || undefined,
        fecha_desde: filterFechaCreacionDesde || undefined,
        fecha_hasta: filterFechaCreacionHasta || undefined,
        context: 'gestion',
      };
      const data = await metricsService.getDashboardMetrics(params);
      setMetrics(data);
    } catch (err) {
      console.error('Error al cargar las métricas del dashboard:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, [filterAsesor, filterFechaCreacionDesde, filterFechaCreacionHasta]);

  const fetchAsesores = useCallback(async () => {
    console.log('fetchAsesores: Iniciando llamada a la API de asesores');
    try {
      const data = await leadsService.getUsers({ page_size: 1000 });
      console.log('fetchAsesores: Datos de asesores recibidos:', data);
      setAsesores(data.results || []);
    } catch (err) {
      console.error('fetchAsesores: Error al cargar los asesores:', err);
      setAsesores([]);
    }
  }, []);

  useEffect(() => {
    console.log('LeadsPage: useEffect disparado');
    fetchLeads();
    fetchMetrics();
    fetchAsesores();
  }, [fetchLeads, fetchMetrics, fetchAsesores]);

  const handleOpenNewLeadModal = () => {
    setEditingLeadId(null);
    setOpenLeadFormModal(true);
  };

  const handleOpenEditLeadModal = (id) => {
    setEditingLeadId(id);
    setOpenLeadFormModal(true);
  };

  const handleCloseLeadFormModal = () => {
    setOpenLeadFormModal(false);
  };

  const handleLeadSaveSuccess = () => {
    fetchLeads();
    fetchMetrics();
    handleCloseLeadFormModal();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const handleFilterTipificacionChange = (event) => {
    setFilterTipificacion(event.target.value);
    setPage(0);
  };

  const handleFilterAsesorChange = (event) => {
    setFilterAsesor(event.target.value);
    setPage(0);
  };

  const handleFilterFechaCreacionDesdeChange = (event) => {
    setFilterFechaCreacionDesde(event.target.value);
    setPage(0);
  };

  const handleFilterFechaCreacionHastaChange = (event) => {
    setFilterFechaCreacionHasta(event.target.value);
    setPage(0);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilterTipificacion('');
    setFilterAsesor('');
    setFilterFechaCreacionDesde('');
    setFilterFechaCreacionHasta('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este lead?')) {
      try {
        await leadsService.deleteLead(id);
        fetchLeads();
      } catch (err) {
        setError('Error al eliminar el lead.');
        console.error('Error deleting lead:', err);
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedLeads(leads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]);
  };

  const handleOpenReassignModal = () => {
    setOpenReassignModal(true);
    setReassignError('');
    setReassignSuccess('');
    setNewAsesor(null);
  };

  const handleCloseReassignModal = () => {
    setOpenReassignModal(false);
    setReassignError('');
    setReassignSuccess('');
    setNewAsesor(null);
  };

  const handleReassign = async () => {
    if (!newAsesor) {
      setReassignError('Selecciona un asesor.');
      return;
    }
    setReassignLoading(true);
    setReassignError('');
    try {
      await leadsService.reassignLeads({ lead_ids: selectedLeads, nuevo_asesor_id: newAsesor.id });
      setReassignSuccess('Leads reasignados correctamente.');
      setSelectedLeads([]);
      fetchLeads();
    } catch (err) {
      setReassignError('Error al reasignar leads.');
    } finally {
      setReassignLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Leads
        </Typography>

        {metrics && !metricsLoading ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AssessmentIcon />
              Métricas Generales
            </Typography>
            <Grid container spacing={3} sx={{ width: '100%', margin: 0 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', textAlign: 'center', backgroundColor: '#1A3578', color: 'white' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
                      Total Leads Asignados
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {metrics.metricas_generales?.total_leads_asignados ?? 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', textAlign: 'center', backgroundColor: '#388e3c', color: 'white' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
                      Leads Gestionados
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {metrics.metricas_generales?.leads_gestionados ?? 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', textAlign: 'center', backgroundColor: '#1976d2', color: 'white' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
                      Citas Confirmadas
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {metrics.metricas_generales?.citas_confirmadas_global ?? 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', textAlign: 'center', backgroundColor: '#757575', color: 'white' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
                      Tasa de Conversión a Citas
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {`${(metrics.metricas_generales?.tasa_conversion_citas ?? 0).toFixed(1)}%`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
        )}

        <Paper elevation={2} sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', boxSizing: 'border-box', mb: 3, p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center" justifyContent="flex-start">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Buscar Leads (Nombre, Celular, Ubicación, Distrito)"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {searchTerm ? (
                        <IconButton onClick={handleClearSearch} edge="end">
                          <ClearIcon />
                        </IconButton>
                      ) : (
                        <SearchIcon />
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Tipificación</InputLabel>
                <Select
                  value={filterTipificacion}
                  onChange={handleFilterTipificacionChange}
                  label="Tipificación"
                >
                  {TIPIFICACION_CHOICES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Asesor</InputLabel>
                <Select
                  value={filterAsesor}
                  onChange={handleFilterAsesorChange}
                  label="Asesor"
                >
                  <MenuItem value="">Todos los Asesores</MenuItem>
                  {asesores.map((asesor) => (
                    <MenuItem key={asesor.id} value={asesor.id}>
                      {asesor.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Fecha Creación Desde"
                type="date"
                value={filterFechaCreacionDesde}
                onChange={handleFilterFechaCreacionDesdeChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Fecha Creación Hasta"
                type="date"
                value={filterFechaCreacionHasta}
                onChange={handleFilterFechaCreacionHastaChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              {(searchTerm || filterTipificacion || filterAsesor || filterFechaCreacionDesde || filterFechaCreacionHasta) && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ClearAllIcon />}
                  onClick={handleClearAllFilters}
                  fullWidth
                >
                  Borrar Filtros
                </Button>
              )}
            </Grid>
            <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', mt: { xs: 2, md: 0 } }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenNewLeadModal}
                fullWidth={true}
              >
                Nuevo Lead
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && leads.length === 0 && (
          <Typography variant="body1" align="center" sx={{ mt: 3 }}>
            No se encontraron leads.
          </Typography>
        )}

        {!loading && !error && leads.length > 0 && (
          <Paper elevation={2} sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', boxSizing: 'border-box', mt: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#1A3578' }}>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Celular</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ubicación</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Medio de Captación</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipificación</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Asesor</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Última Actualización</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} hover selected={selectedLeads.includes(lead.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectOne(lead.id)}
                        />
                      </TableCell>
                      <TableCell>{lead.nombre}</TableCell>
                      <TableCell>{lead.celular}</TableCell>
                      <TableCell>{lead.ubicacion || 'N/A'}</TableCell>
                      <TableCell>{lead.medio || 'N/A'}</TableCell>
                      <TableCell>
                        {lead.tipificacion ? (
                          <Chip
                            label={lead.tipificacion}
                            size="small"
                            color={lead.tipificacion.includes('CITA') ? 'success' : lead.tipificacion === 'NO CONTESTA' ? 'warning' : lead.tipificacion === 'DATO FALSO' ? 'error' : 'default'}
                            variant="filled"
                            sx={{ fontWeight: 'bold', color: 'white', backgroundColor:
                              lead.tipificacion.includes('CITA') ? '#388e3c' :
                              lead.tipificacion === 'NO CONTESTA' ? '#fbc02d' :
                              lead.tipificacion === 'DATO FALSO' ? '#d32f2f' :
                              lead.tipificacion === 'SEGUIMIENTO' ? '#1976d2' :
                              '#757575'
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Sin tipificar
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{lead.asesor ? lead.asesor.username : 'N/A'}</TableCell>
                      <TableCell>{new Date(lead.ultima_actualizacion).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver Detalles">
                          <IconButton onClick={() => navigate(`/leads/${lead.id}`)}>
                            <ViewIcon color="info" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar Lead">
                          <IconButton onClick={() => handleOpenEditLeadModal(lead.id)}>
                            <EditIcon color="warning" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Lead">
                          <IconButton onClick={() => handleDeleteLead(lead.id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalLeads}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Paper>
        )}
        <Button
          variant="contained"
          color="secondary"
          disabled={selectedLeads.length === 0}
          onClick={handleOpenReassignModal}
          sx={{ mt: 2 }}
        >
          Reasignar seleccionados
        </Button>
        <LeadFormModal
          open={openLeadFormModal}
          onClose={handleCloseLeadFormModal}
          leadId={editingLeadId}
          onSaveSuccess={handleLeadSaveSuccess}
          isOPCContext={false}
        />
      </Box>

      <Dialog open={openReassignModal} onClose={handleCloseReassignModal} fullWidth maxWidth="xs">
        <DialogTitle>Reasignar Leads Seleccionados</DialogTitle>
        <DialogContent>
          <Box sx={{ paddingTop: 1 }}>
            {reassignError && <Alert severity="error" sx={{ mb: 2 }}>{reassignError}</Alert>}
            {reassignSuccess && <Alert severity="success" sx={{ mb: 2 }}>{reassignSuccess}</Alert>}
            
            <Autocomplete
              options={asesores}
              loading={reassignLoading}
              value={newAsesor}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name}`.trim() || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onInputChange={(_, newInputValue) => {
                setNewAsesor(newInputValue);
              }}
              onChange={(_, value) => setNewAsesor(value)}
              renderInput={params => (
                <TextField 
                  {...params} 
                  label="Buscar Nuevo Asesor" 
                  margin="normal" 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {reassignLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReassignModal} color="secondary">Cancelar</Button>
          <Button 
            onClick={handleReassign} 
            color="primary" 
            variant="contained" 
            disabled={reassignLoading || !newAsesor}
          >
            {reassignLoading ? <CircularProgress size={20} /> : 'Reasignar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LeadsPage;