// frontend/crm_frontend/src/pages/CsvUpload/CsvUploadPage.jsx
import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Paper, TextField } from '@mui/material';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import leadsService from '../../services/leads'; // Tu servicio de leads

function CsvUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // Para mostrar el resumen

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage('');
    setError('');
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo CSV para subir.');
      return;
    }

    const formData = new FormData();
    formData.append('csv_file', selectedFile); // 'csv_file' debe coincidir con el nombre esperado en backend (request.FILES['csv_file'])

    setLoading(true);
    setMessage('');
    setError('');
    setUploadResult(null);

    try {
      // Llama a la acción personalizada 'upload_csv' en tu LeadViewSet
      const response = await leadsService.uploadCsv(formData); // Asume que leadsService tendrá este método
      setMessage(response.message || 'Carga completada.');
      setUploadResult({
        creados: response.leads_creados,
        actualizados: response.leads_actualizados,
        errores: response.errores || [],
      });
      setSelectedFile(null); // Limpiar el input de archivo
    } catch (err) {
      setError('Error al subir el archivo: ' + (err.response?.data?.error || err.message));
      if (err.response?.data?.errores) {
        setUploadResult({ errores: err.response.data.errores });
      }
      console.error('Error uploading CSV:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cargar Leads desde CSV
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Instrucciones:
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Sube un archivo CSV con tus leads. Las columnas esperadas son:
          **NOMBRE, CELULAR, PROYECTO, MEDIO, DISTRITO, TIPIFICACION, OBSERVACION, OPC, OBSERVACION_OPC.**
          El sistema asignará los leads a los asesores de forma equitativa y actualizará leads existentes por número de celular.
        </Typography>
        <TextField
          type="file"
          inputProps={{ accept: '.csv' }}
          onChange={handleFileChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          label="Seleccionar archivo CSV"
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadFileIcon />}
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          sx={{ mt: 2 }}
        >
          {loading ? 'Subiendo...' : 'Subir CSV'}
        </Button>

        {loading && <CircularProgress sx={{ display: 'block', mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}

        {uploadResult && (
          <Box sx={{ mt: 3 }}>
            {uploadResult.creados !== undefined && (
              <Typography variant="body1">Leads creados: {uploadResult.creados}</Typography>
            )}
            {uploadResult.actualizados !== undefined && (
              <Typography variant="body1">Leads actualizados: {uploadResult.actualizados}</Typography>
            )}
            {uploadResult.errores.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body1">Errores encontrados:</Typography>
                <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {uploadResult.errores.map((err, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={err} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default CsvUploadPage;