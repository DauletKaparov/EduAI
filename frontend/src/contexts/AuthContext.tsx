import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  preferences: Record<string, any>;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (preferences: Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8003';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setUser(response.data);
        } catch (err) {
          console.error('Authentication error:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // For debugging purposes
      console.log(`Attempting to login with username: ${username} to ${API_URL}/api/auth/token`);
      
      // Special case for admin user during development/testing
      if (username === 'admin' && password === 'admin') {
        console.log('Using admin bypass login');
        // Create a mock user for admin
        const mockAdminUser = {
          id: 'admin-id',
          username: 'admin',
          email: 'admin@example.com',
          preferences: {
            knowledge_level: 5.0,
            prefer_explanations: 0.6,
            prefer_examples: 0.3,
            prefer_resources: 0.1,
            prefer_length: 0.5
          },
          created_at: new Date().toISOString()
        };
        
        // Store a fake token
        localStorage.setItem('token', 'admin-dev-token');
        setUser(mockAdminUser);
        console.log('Admin login successful');
        return;
      }
      
      // Try different approaches for regular login
      try {
        // Approach 1: FormData
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        console.log('Trying FormData approach...');
        const response = await axios.post(`${API_URL}/api/auth/token`, formData);
        localStorage.setItem('token', response.data.access_token);
        
        // Get user data
        const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`
          }
        });
        
        setUser(userResponse.data);
        console.log('Login successful with FormData approach');
      } catch (formDataError: any) {
        console.error('FormData approach failed:', formDataError);
        
        // Approach 2: URL encoded form
        try {
          console.log('Trying URLSearchParams approach...');
          const params = new URLSearchParams();
          params.append('username', username);
          params.append('password', password);
          
          const response = await axios.post(`${API_URL}/api/auth/token`, params, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          
          localStorage.setItem('token', response.data.access_token);
          
          // Get user data
          const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${response.data.access_token}`
            }
          });
          
          setUser(userResponse.data);
          console.log('Login successful with URLSearchParams approach');
        } catch (urlParamsError: any) {
          console.error('URLSearchParams approach failed:', urlParamsError);
          throw urlParamsError; // Re-throw to be caught by outer catch block
        }
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      let errorMessage = 'Login failed';
      
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please try again later.';
      } else if (err.response) {
        errorMessage = err.response.data?.detail || 'Invalid credentials';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password,
        preferences: {
          knowledge_level: 5.0,
          prefer_explanations: 0.6,
          prefer_examples: 0.3,
          prefer_resources: 0.1,
          prefer_length: 0.5
        }
      });
      
      // Login after successful registration
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updatePreferences = async (preferences: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token || !user) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.put(
        `${API_URL}/api/users/me`,
        { preferences },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout,
      updatePreferences
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
