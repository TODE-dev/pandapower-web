import axios from 'axios';
import { logger } from '../utils/logger';

// 生产环境直接调用后端 API，开发环境通过 Vite 代理
// 可通过环境变量 VITE_API_BASE_URL 配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${API_BASE_URL}/api/v1/powerflow`;

/**
 * Generate a unique request ID (UUID v4).
 */
function generateRequestId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add request ID and log request
api.interceptors.request.use(
  (config) => {
    // Generate and add request ID
    const requestId = generateRequestId();
    config.headers['X-Request-ID'] = requestId;
    config.metadata = { requestId, startTime: performance.now() };

    logger.info('API request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      requestId,
    });

    return config;
  },
  (error) => {
    logger.error('API request error', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor - log response
api.interceptors.response.use(
  (response) => {
    const { requestId, startTime } = response.config.metadata || {};
    const duration = startTime ? Math.round(performance.now() - startTime) : null;

    logger.info('API response', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      duration_ms: duration,
      requestId,
    });

    return response;
  },
  (error) => {
    const { requestId, startTime } = error.config?.metadata || {};
    const duration = startTime ? Math.round(performance.now() - startTime) : null;

    logger.error('API error', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
      duration_ms: duration,
      requestId,
    });

    return Promise.reject(error);
  }
);

export async function uploadNetwork(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function runPowerFlow(sessionId, params = {}) {
  const response = await api.post(`/run/${sessionId}`, params);
  return response.data;
}

export async function getResults(sessionId) {
  const response = await api.get(`/results/${sessionId}`);
  return response.data;
}

export async function downloadResults(sessionId) {
  const response = await api.get(`/download/${sessionId}`, {
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `powerflow_results_${sessionId.slice(0, 8)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteSession(sessionId) {
  const response = await api.delete(`/session/${sessionId}`);
  return response.data;
}

export async function getSupportedFormats() {
  const response = await api.get('/formats');
  return response.data;
}

export async function getExampleList() {
  const response = await api.get('/examples');
  return response.data;
}

export async function downloadExample(caseName) {
  const response = await api.get(`/examples/${caseName}/download`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${caseName}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
