// frontend/crm_frontend/src/services/leads.js
import apiClient from './api'; // Importa tu instancia de Axios configurada

const leadsService = {
  // Obtener todos los leads, con opciones de búsqueda, filtro y paginación
  getLeads: async (params) => {
    try {
      const response = await apiClient.get('/leads/', { params });
      return response.data; // Contiene results, count, next, previous (si hay paginación)
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  },

  // Obtener un lead por su ID
  getLeadById: async (id) => {
    try {
      const response = await apiClient.get(`/leads/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lead with ID ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo lead
  createLead: async (leadData) => {
    try {
      const response = await apiClient.post('/leads/', leadData);
      return response.data;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },

  // Actualizar un lead existente
  updateLead: async (id, leadData) => {
    try {
      const response = await apiClient.put(`/leads/${id}/`, leadData);
      return response.data;
    } catch (error) {
      console.error(`Error updating lead with ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un lead
  deleteLead: async (id) => {
    try {
      const response = await apiClient.delete(`/leads/${id}/`);
      return response.status; // Devuelve 204 No Content en éxito
    } catch (error) {
      console.error(`Error deleting lead with ID ${id}:`, error);
      throw error;
    }
  },

  // Obtener historial de acciones de un lead
  getLeadActions: async (leadId) => {
    try {
      const response = await apiClient.get(`/leads/${leadId}/actions/`); // Endpoint personalizado en el backend
      return response.data;
    } catch (error) {
      console.error(`Error fetching actions for lead ID ${leadId}:`, error);
      throw error;
    }
  },

  uploadCsv: async (formData) => {
    try {
      const response = await apiClient.post('/leads/upload_csv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Importante para enviar archivos
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading CSV:', error);
      throw error;
    }
  },

  // Obtener la lista de usuarios (asesores) para los selectores
  getUsers: async (params) => {
    try {
      const response = await apiClient.get('/users/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Obtener duplicados de leads
  getLeadDuplicates: async (params) => {
    try {
      const response = await apiClient.get('/lead-duplicates/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching lead duplicates:', error);
      throw error;
    }
  },

  // Fusionar un duplicado
  fusionarLeadDuplicate: async (id) => {
    try {
      const response = await apiClient.post(`/lead-duplicates/${id}/fusionar/`);
      return response.data;
    } catch (error) {
      console.error('Error merging lead duplicate:', error);
      throw error;
    }
  },

  // Ignorar un duplicado
  ignorarLeadDuplicate: async (id) => {
    try {
      const response = await apiClient.post(`/lead-duplicates/${id}/ignorar/`);
      return response.data;
    } catch (error) {
      console.error('Error ignoring lead duplicate:', error);
      throw error;
    }
  },

  // Reasignar leads masivamente
  reassignLeads: async (payload) => {
    try {
      const response = await apiClient.post('/leads/reasignar/', payload);
      return response.data;
    } catch (error) {
      console.error('Error reassigning leads:', error);
      throw error;
    }
  },
};


export default leadsService;