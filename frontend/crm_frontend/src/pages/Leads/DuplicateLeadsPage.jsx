import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, TextField
} from '@mui/material';
import { Search as SearchIcon, Check as CheckIcon, Block as BlockIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import leadsService from '../../services/leads';

function DuplicateLeadsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [refreshFlag, setRefreshFlag] = useState(false);

  const fetchDuplicates = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        search,
        ordering: '-fecha_importacion',
      };
      const res = await leadsService.getLeadDuplicates(params);
      setDuplicates(res.results || []);
      setTotal(res.count || 0);
    } catch (err) {
      setError('Error al cargar duplicados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
    // eslint-disable-next-line
  }, [page, rowsPerPage, search, refreshFlag]);

  const handleFusionar = async (id) => {
    setLoading(true);
    try {
      await leadsService.fusionarLeadDuplicate(id);
      setRefreshFlag(f => !f);
    } catch (err) {
      setError('Error al fusionar el duplicado.');
    } finally {
      setLoading(false);
    }
  };

  const handleIgnorar = async (id) => {
    setLoading(true);
    try {
      await leadsService.ignorarLeadDuplicate(id);
      setRefreshFlag(f => !f);
    } catch (err) {
      setError('Error al ignorar el duplicado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Gestión de Duplicados</Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Buscar duplicados"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ endAdornment: <SearchIcon /> }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 300 }}
          />
          <IconButton onClick={() => setRefreshFlag(f => !f)}><RefreshIcon /></IconButton>
        </Box>
      </Paper>
      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', my: 4 }} />}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      {!loading && !error && (
        <Paper elevation={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Celular</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Asesor</TableCell>
                  <TableCell>Fecha Interacción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {duplicates.map(dup => (
                  <TableRow key={dup.id}>
                    <TableCell>{dup.nombre}</TableCell>
                    <TableCell>{dup.celular}</TableCell>
                    <TableCell>{dup.email || '-'}</TableCell>
                    <TableCell>{dup.asesor_details ? dup.asesor_details.username : '-'}</TableCell>
                    <TableCell>{dup.fecha_interaccion || '-'}</TableCell>
                    <TableCell>{dup.estado}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleFusionar(dup.id)}
                        disabled={dup.estado !== 'pendiente'}
                      >Fusionar</Button>
                      <Button
                        size="small"
                        color="warning"
                        startIcon={<BlockIcon />}
                        onClick={() => handleIgnorar(dup.id)}
                        disabled={dup.estado !== 'pendiente'}
                      >Ignorar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Filas por página:"
          />
        </Paper>
      )}
    </Box>
  );
}

export default DuplicateLeadsPage; 