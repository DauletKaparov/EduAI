import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8003';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/token', formData);
  },
  register: (userData: any) => api.post('/api/auth/register', userData),
  getCurrentUser: () => api.get('/api/auth/me'),
};

// Subject endpoints
export const subjectsAPI = {
  getAll: () => api.get('/api/subjects'),
  getById: (id: string) => api.get(`/api/subjects/${id}`),
};

// Topic endpoints
export const topicsAPI = {
  getAll: (subjectId?: string) => {
    const params = subjectId ? { subject_id: subjectId } : {};
    return api.get('/api/topics', { params });
  },
  getById: (id: string) => api.get(`/api/topics/${id}`),
};

// Content endpoints
export const contentsAPI = {
  getByTopic: (topicId: string, contentType?: string) => {
    const params = { topic_id: topicId };
    if (contentType) {
      Object.assign(params, { content_type: contentType });
    }
    return api.get('/api/contents', { params });
  },
  getById: (id: string) => api.get(`/api/contents/${id}`),
};

// User endpoints
export const usersAPI = {
  updateProfile: (data: any) => api.put('/api/users/me', data),
  getProgress: () => api.get('/api/users/me/progress'),
  updateProgress: (progressData: any) => api.post('/api/users/me/progress', progressData),
};

// AI Generator endpoints
export const generatorAPI = {
  generateStudySheet: (topicId: string) => 
    api.post('/api/generate/studysheet', { topic_id: topicId }),
  generateQuestions: (topicId: string, numQuestions: number = 5) => 
    api.post('/api/generate/questions', { topic_id: topicId, num_questions: numQuestions }),
  getRecommendations: (topicId?: string, limit: number = 5) => {
    const params = { limit };
    if (topicId) {
      Object.assign(params, { topic_id: topicId });
    }
    return api.post('/api/generate/recommendations', params);
  },
};

export default api;
