import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

export const api = {
  uploadDataset: async (file, numBanks = 5) => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('num_banks', numBanks.toString());
    const res = await axios.post(`${API_BASE}/upload/dataset`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  listBanks: async () => {
    const res = await axios.get(`${API_BASE}/banks/list`);
    return res.data;
  },

  resetTrustScores: async () => {
    const res = await axios.post(`${API_BASE}/banks/reset-trust`);
    return res.data;
  },

  getBankTrustScore: async (bankId) => {
    const res = await axios.get(`${API_BASE}/bank/${bankId}/trust-score`);
    return res.data;
  },

  trainFederated: async (rounds, method) => {
    const res = await axios.post(`${API_BASE}/train/federated`, { rounds, method });
    return res.data;
  },

  stopTraining: async () => {
    const res = await axios.post(`${API_BASE}/train/stop`);
    return res.data;
  },

  getGlobalAccuracy: async () => {
    const res = await axios.get(`${API_BASE}/model/global-accuracy`);
    return res.data;
  },

  getAllMetrics: async () => {
    const res = await axios.get(`${API_BASE}/metrics/all`);
    return res.data;
  },

  getTrainingStatus: async () => {
    const res = await axios.get(`${API_BASE}/training/status`);
    return res.data;
  },

  predictFraud: async (transaction, modelType) => {
    const res = await axios.post(`${API_BASE}/predict/fraud?model_type=${modelType}`, transaction);
    return res.data;
  },
};

export const getWebSocketUrl = () => {
  const wsProtocol = API_BASE.startsWith('https') ? 'wss' : 'ws';
  const url = API_BASE.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${url}/ws/training`;
};
