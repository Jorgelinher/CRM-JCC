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
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import leadsService from '../../services/leads';
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

      const response = await leadsService.getLeads(params);
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
    console.log('LeadsPage: useEffect fetchLeads disparado');
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    console.log('LeadsPage: useEffect fetchAsesores disparado');
    fetchAsesores();
  }, [fetchAsesores]);

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Leads
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Buscar Leads (Nombre, Celular, Proyecto, Distrito)"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 250 }}
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
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
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
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
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
            <TextField
              label="Fecha Creación Desde"
              type="date"
              value={filterFechaCreacionDesde}
              onChange={handleFilterFechaCreacionDesdeChange}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="Fecha Creación Hasta"
              type="date"
              value={filterFechaCreacionHasta}
              onChange={handleFilterFechaCreacionHastaChange}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            {(searchTerm || filterTipificacion || filterAsesor || filterFechaCreacionDesde || filterFechaCreacionHasta) && (
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
              onClick={handleOpenNewLeadModal}
              sx={{ ml: 'auto' }}
            >
              Nuevo Lead
            </Button>
          </Box>

          {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
          {error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && leads.length === 0 && (
            <Typography variant="body1" align="center" sx={{ mt: 3 }}>
              No se encontraron leads.
            </Typography>
          )}

          {!loading && !error && leads.length > 0 && (
            <Paper elevation={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Celular</TableCell>
                      <TableCell>Proyecto</TableCell>
                      <TableCell>Medio de Captación</TableCell>{/* NUEVO: Columna Medio de Captación */}
                      <TableCell>Tipificación</TableCell>
                      <TableCell>Asesor</TableCell>
                      <TableCell>Última Actualización</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.nombre}</TableCell>
                        <TableCell>{lead.celular}</TableCell>
                        <TableCell>{lead.proyecto}</TableCell>
                        <TableCell>{lead.medio || 'N/A'}</TableCell>{/* NUEVO: Mostrar Medio de Captación */}
                        <TableCell>{lead.tipificacion}</TableCell>
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
          <LeadFormModal
            open={openLeadFormModal}
            onClose={handleCloseLeadFormModal}
            leadId={editingLeadId}
            onSaveSuccess={handleLeadSaveSuccess}
          />
        </Box>
      );
    }

    export default LeadsPage;