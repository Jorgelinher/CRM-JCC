// frontend/crm_frontend/src/services/opcPersonnel.js (NUEVO ARCHIVO)
import apiClient from './api'; // Importa tu instancia de Axios configurada

const opcPersonnelService = {
  getPersonnel: async (params) => {
    try {
      const response = await apiClient.get('/opc-personnel/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching OPC personnel:', error);
      throw error;
    }
  },

  getPersonnelById: async (id) => {
    try {
      const response = await apiClient.get(`/opc-personnel/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching OPC personnel with ID ${id}:`, error);
      throw error;
    }
  },

  createPersonnel: async (personnelData) => {
    try {
      const response = await apiClient.post('/opc-personnel/', personnelData);
      return response.data;
    } catch (error) {
      console.error('Error creating OPC personnel:', error);
      throw error;
    }
  },

  updatePersonnel: async (id, personnelData) => {
    try {
      const response = await apiClient.put(`/opc-personnel/${id}/`, personnelData);
      return response.data;
    } catch (error) {
      console.error(`Error updating OPC personnel with ID ${id}:`, error);
      throw error;
    }
  },

  deletePersonnel: async (id) => {
    try {
      const response = await apiClient.delete(`/opc-personnel/${id}/`);
      return response.status;
    } catch (error) {
      console.error(`Error deleting OPC personnel with ID ${id}:`, error);
      throw error;
    }
  },
};

export default opcPersonnelService;