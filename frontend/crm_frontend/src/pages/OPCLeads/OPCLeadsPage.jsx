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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  ClearAll as ClearAllIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import leadsService from '../../services/leads';
import opcPersonnelService from '../../services/opcPersonnel';
import opcMetricsService from '../../services/opcMetrics';
import LeadFormModal from '../../components/leads/LeadFormModal';

const MEDIO_CAPTACION_CHOICES = [
  { value: '', label: 'Todos los Medios' },
  { value: 'Campo (Centros Comerciales)', label: 'Campo (Centros Comerciales)' },
  { value: 'Redes Sociales (Facebook)', label: 'Redes Sociales (Facebook)' },
  { value: 'Redes Sociales (Instagram)', label: 'Redes Sociales (Instagram)' },
  { value: 'Redes Sociales (WhatsApp)', label: 'Redes Sociales (WhatsApp)' },
  { value: 'Referidos', label: 'Referidos' },
];

// Función para obtener el color del chip según la tipificación
const getTipificacionColor = (tipificacion) => {
  if (!tipificacion) return 'default';
  
  if (tipificacion.includes('CITA')) return 'success';
  if (tipificacion === 'SEGUIMIENTO') return 'warning';
  if (tipificacion.includes('NO INTERESADO')) return 'error';
  if (tipificacion === 'NO CONTESTA') return 'info';
  if (tipificacion === 'YA ASISTIO') return 'success';
  
  return 'default';
};

function OPCLeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPersonalOPC, setFilterPersonalOPC] = useState('');
  const [filterSupervisorOPC, setFilterSupervisorOPC] = useState('');
  const [filterFechaCaptacionDesde, setFilterFechaCaptacionDesde] = useState('');
  const [filterFechaCaptacionHasta, setFilterFechaCaptacionHasta] = useState('');
  const [filterTipificacion, setFilterTipificacion] = useState('');
  const [filterOPC, setFilterOPC] = useState('');

  const [opcPersonnelList, setOpcPersonnelList] = useState([]);
  const [opcSupervisorsList, setOpcSupervisorsList] = useState([]);

  const [openLeadFormModal, setOpenLeadFormModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLeads, setTotalLeads] = useState(0);

  // Nuevo estado para métricas
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        search: searchTerm,
        tipificacion: filterTipificacion,
        personal_opc_captador: filterOPC,
        'fecha_creacion_after': filterFechaCaptacionDesde,
        'fecha_creacion_before': filterFechaCaptacionHasta,
        ordering: '-fecha_creacion',
        // Mostrar todos los leads OPC y directeos
        es_opc_lead: true,
      };
      const response = await leadsService.getLeads(params);
      setLeads(response.results || []);
      setTotalLeads(response.count || 0);
    } catch (err) {
      setError('Error al cargar los leads OPC.');
      setLeads([]);
      setTotalLeads(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterTipificacion, filterOPC, filterFechaCaptacionDesde, filterFechaCaptacionHasta]);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const params = {
        personal_opc_id: filterPersonalOPC || undefined,
        supervisor_opc_id: filterSupervisorOPC || undefined,
        fecha_desde: filterFechaCaptacionDesde || undefined,
        fecha_hasta: filterFechaCaptacionHasta || undefined,
      };
      
      const data = await opcMetricsService.getOPCLeadsMetrics(params);
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching OPC metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, [filterPersonalOPC, filterSupervisorOPC, filterFechaCaptacionDesde, filterFechaCaptacionHasta]);

  const fetchOpcPersonnelForFilters = useCallback(async () => {
    try {
        const [opcData, supervisorsData] = await Promise.all([
            opcPersonnelService.getPersonnel({ page_size: 1000 }),
            opcPersonnelService.getPersonnel({ rol: 'SUPERVISOR', page_size: 1000 }),
        ]);
        setOpcPersonnelList(opcData.results || []);
        setOpcSupervisorsList(supervisorsData.results || []);
    } catch (err) {
        console.error('Error fetching OPC personnel for filters:', err);
    }
  }, []);

  useEffect(() => {
    fetchOpcPersonnelForFilters();
    fetchLeads();
    fetchMetrics();
  }, [fetchOpcPersonnelForFilters, fetchLeads, fetchMetrics]);

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
    fetchLeads(); // Recargar la lista después de guardar
    fetchMetrics(); // Recargar métricas
    handleCloseLeadFormModal();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterPersonalOPCChange = (event) => {
    setFilterPersonalOPC(event.target.value);
    setPage(0);
  };

  const handleFilterSupervisorOPCChange = (event) => {
    setFilterSupervisorOPC(event.target.value);
    setPage(0);
  };

  const handleFilterFechaCaptacionDesdeChange = (event) => {
    setFilterFechaCaptacionDesde(event.target.value);
    setPage(0);
  };

  const handleFilterFechaCaptacionHastaChange = (event) => {
    setFilterFechaCaptacionHasta(event.target.value);
    setPage(0);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilterPersonalOPC('');
    setFilterSupervisorOPC('');
    setFilterFechaCaptacionDesde('');
    setFilterFechaCaptacionHasta('');
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
    if (window.confirm('¿Estás seguro de que quieres eliminar este lead OPC?')) {
      try {
        await leadsService.deleteLead(id);
        fetchLeads();
        fetchMetrics();
      } catch (err) {
        setError('Error al eliminar el lead OPC.');
        console.error('Error deleting OPC lead:', err);
      }
    }
  };

  const handleViewLeadDetail = (id) => {
    navigate(`/leads/${id}`);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Leads OPC
      </Typography>

      {/* Métricas */}
      {metrics && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AssessmentIcon />
            Métricas de Leads OPC
          </Typography>
          <Grid container spacing={3} sx={{ width: '100%', margin: 0 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', backgroundColor: '#1A3578', color: 'white' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                  <Typography sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
                    Total Leads OPC
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {metrics.total_leads_opc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', backgroundColor: '#388e3c', color: 'white' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                  <Typography sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
                    Asignados
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {metrics.leads_asignados}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {metrics.porcentaje_asignacion.toFixed(1)}% del total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', backgroundColor: '#1976d2', color: 'white' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                  <Typography sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
                    Sin Asignar
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {metrics.leads_sin_asignar}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', backgroundColor: '#757575', color: 'white' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                  <Typography sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
                    Captados (últimos 30d)
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {metrics.leads_ultimos_30_dias}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Filtros */}
      <Paper elevation={2} sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', boxSizing: 'border-box', p: 2, mb: 3, backgroundColor: 'white', boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%', margin: 0, boxSizing: 'border-box' }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Personal OPC</InputLabel>
              <Select
                value={filterPersonalOPC}
                onChange={handleFilterPersonalOPCChange}
                label="Personal OPC"
              >
                <MenuItem value="">Todos</MenuItem>
                {opcPersonnelList.map((personnel) => (
                  <MenuItem key={personnel.id} value={personnel.id}>
                    {personnel.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Supervisor OPC</InputLabel>
              <Select
                value={filterSupervisorOPC}
                onChange={handleFilterSupervisorOPCChange}
                label="Supervisor OPC"
              >
                <MenuItem value="">Todos</MenuItem>
                {opcSupervisorsList.map((supervisor) => (
                  <MenuItem key={supervisor.id} value={supervisor.id}>
                    {supervisor.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Desde"
              value={filterFechaCaptacionDesde}
              onChange={handleFilterFechaCaptacionDesdeChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Hasta"
              value={filterFechaCaptacionHasta}
              onChange={handleFilterFechaCaptacionHastaChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              variant="outlined"
              onClick={handleClearAllFilters}
              startIcon={<ClearAllIcon />}
              fullWidth
            >
              Limpiar
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2} sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              onClick={handleOpenNewLeadModal}
              startIcon={<AddIcon />}
              fullWidth
            >
              Nuevo Lead OPC
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de leads */}
      <Paper elevation={2} sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', boxSizing: 'border-box', mt: 2 }}>
        <TableContainer sx={{ width: '100%' }}>
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1A3578' }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Celular</TableCell>
                <TableCell>Personal OPC</TableCell>
                <TableCell>Supervisor OPC</TableCell>
                <TableCell>Fecha Captación</TableCell>
                <TableCell>Asesor Asignado</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>Tipificación Asesor</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>Medio</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {lead.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>{lead.celular}</TableCell>
                  <TableCell>
                    {lead.personal_opc_captador_details ? (
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {lead.personal_opc_captador_details.nombre}
                        </Typography>
                        <Chip 
                          label={lead.personal_opc_captador_details.rol} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No asignado
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.supervisor_opc_captador_details ? (
                      <Typography variant="body2">
                        {lead.supervisor_opc_captador_details.nombre}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No asignado
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.fecha_captacion ? (
                      new Date(lead.fecha_captacion).toLocaleDateString('es-ES')
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No especificada
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.asesor_details ? (
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {lead.asesor_details.first_name} {lead.asesor_details.last_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          @{lead.asesor_details.username}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip 
                        label="Sin asignar" 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.tipificacion ? (
                      <Chip
                        label={lead.tipificacion}
                        size="small"
                        color={getTipificacionColor(lead.tipificacion)}
                        variant="filled"
                        sx={{ fontWeight: 'bold', color: 'white', backgroundColor: lead.tipificacion.includes('CITA') ? '#388e3c' : getTipificacionColor(lead.tipificacion) === 'default' ? '#757575' : undefined }}
                      />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Sin tipificar
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.medio ? (
                      <Typography variant="body2">
                        {lead.medio}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No especificado
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleViewLeadDetail(lead.id)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditLeadModal(lead.id)}
                          color="warning"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteLead(lead.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
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

      {/* Modal para crear/editar lead */}
      <LeadFormModal
        open={openLeadFormModal}
        onClose={handleCloseLeadFormModal}
        onSaveSuccess={handleLeadSaveSuccess}
        leadId={editingLeadId}
        isOPCContext={true}
      />
    </Box>
  );
}

export default OPCLeadsPage;