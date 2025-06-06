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
import opcPersonnelService from '../../services/opcPersonnel';
import LeadFormModal from '../../components/leads/LeadFormModal';

const MEDIO_CAPTACION_CHOICES = [
  { value: '', label: 'Todos los Medios' },
  { value: 'Campo (Centros Comerciales)', label: 'Campo (Centros Comerciales)' },
  { value: 'Redes Sociales (Facebook)', label: 'Redes Sociales (Facebook)' },
  { value: 'Redes Sociales (Instagram)', label: 'Redes Sociales (Instagram)' },
  { value: 'Redes Sociales (WhatsApp)', label: 'Redes Sociales (WhatsApp)' },
  { value: 'Referidos', label: 'Referidos' },
];

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

  const [opcPersonnelList, setOpcPersonnelList] = useState([]);
  const [opcSupervisorsList, setOpcSupervisorsList] = useState([]);


  const [openLeadFormModal, setOpenLeadFormModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLeads, setTotalLeads] = useState(0);


  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        search: searchTerm,
        personal_opc_captador: filterPersonalOPC || undefined,
        supervisor_opc_captador: filterSupervisorOPC || undefined,
        'fecha_captacion_after': filterFechaCaptacionDesde || undefined,
        'fecha_captacion_before': filterFechaCaptacionHasta || undefined,
        is_opc_lead: true, // FILTRO CLAVE: Mostrar solo leads OPC
        ordering: '-fecha_captacion',
      };
      console.log("OPCLeadsPage: Parámetros de filtro enviados:", params);

      const response = await leadsService.getLeads(params);
      setLeads(response.results || []);
      setTotalLeads(response.count || 0);

    } catch (err) {
      setError('Error al cargar los leads OPC.');
      console.error('Error fetching OPC leads:', err.response?.data || err);
      setLeads([]);
      setTotalLeads(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterPersonalOPC, filterSupervisorOPC, filterFechaCaptacionDesde, filterFechaCaptacionHasta]);


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
  }, [fetchOpcPersonnelForFilters, fetchLeads]);

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
      } catch (err) {
        setError('Error al eliminar el lead OPC.');
        console.error('Error deleting OPC lead:', err);
      }
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Leads OPC
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Buscar (Nombre, Celular, Calle/Módulo)"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 250 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {searchTerm ? (
                  <IconButton onClick={() => setSearchTerm('')} edge="end">
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
          <InputLabel>Personal OPC</InputLabel>
          <Select
            value={filterPersonalOPC}
            onChange={handleFilterPersonalOPCChange}
            label="Personal OPC"
          >
            <MenuItem value="">Todos</MenuItem>
            {opcPersonnelList.map((opc) => (
              <MenuItem key={opc.id} value={opc.id}>
                {opc.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Supervisor OPC</InputLabel>
          <Select
            value={filterSupervisorOPC}
            onChange={handleFilterSupervisorOPCChange}
            label="Supervisor OPC"
          >
            <MenuItem value="">Todos</MenuItem>
            {opcSupervisorsList.map((sup) => (
              <MenuItem key={sup.id} value={sup.id}>
                {sup.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Fecha Captación Desde"
          type="date"
          value={filterFechaCaptacionDesde}
          onChange={handleFilterFechaCaptacionDesdeChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Fecha Captación Hasta"
          type="date"
          value={filterFechaCaptacionHasta}
          onChange={handleFilterFechaCaptacionHastaChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        {(searchTerm || filterPersonalOPC || filterSupervisorOPC || filterFechaCaptacionDesde || filterFechaCaptacionHasta) && (
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
          Nuevo Lead OPC
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && leads.length === 0 && (
        <Typography variant="body1" align="center" sx={{ mt: 3 }}>
          No se encontraron leads OPC.
        </Typography>
      )}

      {!loading && !error && leads.length > 0 && (
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre Lead</TableCell>
                  <TableCell>Teléfono Lead</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Proyecto de Interés</TableCell>
                  <TableCell>Medio de Captación</TableCell>
                  <TableCell>Personal OPC</TableCell>
                  <TableCell>Supervisor OPC</TableCell>
                  <TableCell>Fecha Captación</TableCell>
                  <TableCell>Calle/Módulo</TableCell>
                  <TableCell>Tipificación</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.nombre}</TableCell>
                    <TableCell>{lead.celular}</TableCell>
                    <TableCell>{lead.ubicacion || 'N/A'}</TableCell>
                    <TableCell>{lead.proyecto_interes || 'N/A'}</TableCell>
                    <TableCell>{lead.medio || 'N/A'}</TableCell>
                    <TableCell>{lead.personal_opc_captador_details ? lead.personal_opc_captador_details.nombre : 'N/A'}</TableCell>
                    <TableCell>{lead.supervisor_opc_captador_details ? lead.supervisor_opc_captador_details.nombre : 'N/A'}</TableCell>
                    <TableCell>{lead.fecha_captacion || 'N/A'}</TableCell>
                    <TableCell>{lead.calle_o_modulo || 'N/A'}</TableCell>
                    <TableCell>{lead.tipificacion}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver Detalles">
                        <IconButton onClick={() => navigate(`/leads/${lead.id}`)}>
                          <ViewIcon color="info" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar Lead OPC">
                        <IconButton onClick={() => handleOpenEditLeadModal(lead.id)}>
                          <EditIcon color="warning" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar Lead OPC">
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
        isOPCContext={true}
      />
    </Box>
  );
}

export default OPCLeadsPage;