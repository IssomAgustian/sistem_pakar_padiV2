import api from './api';

const symptomService = {
  // Get all symptoms
  getAllSymptoms: async () => {
    try {
      const response = await api.get('/symptoms');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch symptoms');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get symptoms by category
  getSymptomsByCategory: async (category) => {
    try {
      const response = await api.get(`/symptoms/category/${category}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch symptoms');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get symptom by ID
  getSymptomById: async (id) => {
    try {
      const response = await api.get(`/symptoms/${id}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch symptom');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get symptom categories
  getCategories: async () => {
    try {
      const response = await api.get('/symptoms/categories');
      if (response.data.success) {
        return response.data.data;
      }
      return ['daun', 'batang', 'akar', 'bulir', 'malai', 'pertumbuhan'];
    } catch (error) {
      return ['daun', 'batang', 'akar', 'bulir', 'malai', 'pertumbuhan'];
    }
  },
};

export default symptomService;
