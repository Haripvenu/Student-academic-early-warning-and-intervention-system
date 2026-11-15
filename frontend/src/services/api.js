import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const api = {
  getHealth: async () => {
    const res = await axios.get(`${API_BASE_URL}/health`);
    return res.data;
  },

  getDashboardStats: async () => {
    const res = await axios.get(`${API_BASE_URL}/dashboard/stats`);
    return res.data;
  },

  getSampleStudents: async () => {
    const res = await axios.get(`${API_BASE_URL}/students/sample`);
    return res.data;
  },

  getModelMetrics: async () => {
    const res = await axios.get(`${API_BASE_URL}/model/metrics`);
    return res.data;
  },

  getFeatureSpecs: async () => {
    const res = await axios.get(`${API_BASE_URL}/feature-specs`);
    return res.data;
  },

  predictSingle: async (features) => {
    const res = await axios.post(`${API_BASE_URL}/predict`, features);
    return res.data;
  },

  simulateWhatIf: async (baseFeatures, modifiedFeatures) => {
    const res = await axios.post(`${API_BASE_URL}/what-if`, {
      base_features: baseFeatures,
      modified_features: modifiedFeatures
    });
    return res.data;
  },

  uploadBatchCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE_URL}/predict-batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};
