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

// Helper function for retry logic
const withRetry = async (fn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      if (attempt < maxRetries - 1) {
        // Wait before next retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
};

// AI Generator endpoints with enhanced error handling and retry logic
export const generatorAPI = {
  generateStudySheet: async (topicId: string) => {
    try {
      // First try the test endpoint with retry logic
      return await withRetry(() => api.get(`/api/test/studysheet/${topicId}`));
    } catch (error) {
      console.error('Failed to generate study sheet with test endpoint:', error);
      
      // As a fallback, try direct fetch with no auth
      try {
        const directResponse = await fetch(`${API_URL}/api/test/studysheet/${topicId}`);
        if (!directResponse.ok) {
          throw new Error(`Direct API call failed with status: ${directResponse.status}`);
        }
        const data = await directResponse.json();
        return { status: 200, data };
      } catch (directError) {
        console.error('Direct API call also failed:', directError);
        throw new Error('All attempts to generate study sheet failed');
      }
    }
  },
  
  // Fetch an existing study sheet without regenerating it
  fetchStudySheet: async (topicId: string) => {
    try {
      // First try with fetch_only parameter
      return await withRetry(() => api.get(`/api/test/studysheet/${topicId}?fetch_only=true`));
    } catch (error) {
      console.error('Failed to fetch existing study sheet:', error);
      
      // As a fallback, try without fetch_only parameter
      try {
        console.log('Trying fallback without fetch_only parameter');
        return await api.get(`/api/test/studysheet/${topicId}`);
      } catch (fallbackError) {
        console.error('Fallback attempt also failed:', fallbackError);
        
        // Last resort: direct fetch
        try {
          const directResponse = await fetch(`${API_URL}/api/test/studysheet/${topicId}`);
          if (!directResponse.ok) {
            throw new Error(`Direct API call failed with status: ${directResponse.status}`);
          }
          const data = await directResponse.json();
          return { status: 200, data };
        } catch (directError) {
          console.error('All fetch attempts failed:', directError);
          throw new Error('Unable to retrieve study sheet');
        }
      }
    }
  },
  
  generateQuestions: (topicId: string, numQuestions: number = 5) => 
    withRetry(() => api.post('/api/generate/questions', { topic_id: topicId, num_questions: numQuestions })),
    
  getRecommendations: (topicId?: string, limit: number = 5) => {
    const params = { limit };
    if (topicId) {
      Object.assign(params, { topic_id: topicId });
    }
    return withRetry(() => api.post('/api/generate/recommendations', params));
  },
};

export default api;
