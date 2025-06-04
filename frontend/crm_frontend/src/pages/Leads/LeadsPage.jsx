
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
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import leadsService from '../../services/leads';
import LeadFormModal from '../../components/leads/LeadFormModal'; // <-- IMPORTAR EL NUEVO MODAL

const TIPIFICACION_CHOICES = [
  { value: '', label: 'Todas las Tipificaciones' },
  { value: 'Nuevo', label: 'Nuevo' },
  { value: 'Contactado', label: 'Contactado' },
  { value: 'Interesado', label: 'Interesado' },
  { value: 'No Contesta', label: 'No Contesta' },
  { value: 'Descartado', label: 'Descartado' },
  { value: 'Cita Agendada', label: 'Cita Agendada' },
  { value: 'Cita Confirmada', label: 'Cita Confirmada' },
  { value: 'Cita Realizada', label: 'Cita Realizada' },
  { value: 'Seguimiento', label: 'Seguimiento' },
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

  // NUEVOS ESTADOS para el Modal del Formulario
  const [openLeadFormModal, setOpenLeadFormModal] = useState(false); // Controla si el modal está abierto
  const [editingLeadId, setEditingLeadId] = useState(null); // ID del lead a editar, null para nuevo


  // Paginación
  const [page, setPage] = useState(0); // Página actual (0-indexed para MUI TablePagination)
  const [rowsPerPage, setRowsPerPage] = useState(10); // Elementos por página
  const [totalLeads, setTotalLeads] = useState(0); // Total de leads devueltos por el backend


  // fetchLeads ahora enviará los parámetros y espera una respuesta paginada
  const fetchLeads = useCallback(async () => {
    console.log('fetchLeads: Iniciando llamada a la API de leads con parámetros (paginación real)');
    setLoading(true);
    setError('');
    try {
      const params = { // <-- Los parámetros se envían aquí para que la búsqueda y filtro funcionen
        page: page + 1, // Django usa paginación 1-indexed
        page_size: rowsPerPage, // Envía el tamaño de página
        search: searchTerm,
        tipificacion: filterTipificacion,
        asesor: filterAsesor,
        'fecha_creacion_gte': filterFechaCreacionDesde, // Parámetro para fecha de creación 'desde' (gte = greater than or equal)
        'fecha_creacion_lte': filterFechaCreacionHasta, // Parámetro para fecha de creación 'hasta' (lte = less than or equal)
        ordering: '-fecha_creacion', // Ordenar por fecha de creación descendente por defecto
      };

      // ¡CORRECCIÓN CLAVE! Ahora esperamos la respuesta paginada
      const response = await leadsService.getLeads(params); // <-- Envía los parámetros. 'response' será el objeto paginado.
      console.log('fetchLeads: Datos de leads recibidos (paginados):', response);

      setLeads(response.results || []); // ¡CORRECCIÓN CLAVE! Asigna 'response.results' (el array de leads) a 'leads'
      setTotalLeads(response.count || 0); // ¡CORRECCIÓN CLAVE! Asigna 'response.count' (el total de leads) a 'totalLeads'

    } catch (err) {
      console.error('fetchLeads: Error al cargar los leads:', err);
      setError('Error al cargar los leads.');
      setLeads([]);
      setTotalLeads(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterTipificacion, filterAsesor, filterFechaCreacionDesde, filterFechaCreacionHasta]); // Las dependencias son importantes para que se recargue al cambiar filtros/paginación.


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

  // NUEVOS HANDLERS para abrir el modal
  const handleOpenNewLeadModal = () => {
    setEditingLeadId(null); // No hay ID, es un lead nuevo
    setOpenLeadFormModal(true);
  };

  const handleOpenEditLeadModal = (id) => {
    setEditingLeadId(id); // Pasar el ID del lead a editar
    setOpenLeadFormModal(true);
  };

  const handleCloseLeadFormModal = () => {
    setOpenLeadFormModal(false);
  };

  const handleLeadSaveSuccess = () => {
    fetchLeads(); // Recargar la lista de leads después de guardar
    handleCloseLeadFormModal(); // Cerrar el modal
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reiniciar a la primera página con una nueva búsqueda
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0); // Reiniciar a la primera página
  };

  const handleFilterTipificacionChange = (event) => {
    setFilterTipificacion(event.target.value);
    setPage(0); // Reiniciar a la primera página con un nuevo filtro
  };

  const handleFilterAsesorChange = (event) => {
    setFilterAsesor(event.target.value);
    setPage(0); // Reiniciar a la primera página con un nuevo filtro
  };

  const handleFilterFechaCreacionDesdeChange = (event) => {
    setFilterFechaCreacionDesde(event.target.value);
    setPage(0);
  };

  const handleFilterFechaCreacionHastaChange = (event) => {
    setFilterFechaCreacionHasta(event.target.value);
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
        fetchLeads(); // Recargar leads después de eliminar
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
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenNewLeadModal} // <-- AHORA ABRE EL MODAL
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
                            <IconButton onClick={() => handleOpenEditLeadModal(lead.id)}> {/* <-- AHORA ABRE EL MODAL PARA EDITAR */}
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
          {/* EL MODAL DE FORMULARIO DE LEADS SE RENDERIZA AQUÍ */}
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
