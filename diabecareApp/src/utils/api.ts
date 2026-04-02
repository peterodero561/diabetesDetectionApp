import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, API_BASE_URL } from './constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 – clear token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      // Optionally trigger a logout event
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  type: 'admin' | 'doctor' | 'patient';
  doctor_id?: number;  // only for patients
  created_at: string;
}

// Login
export const login = async (email: string, pin: string): Promise<{ user: User; token: string }> => {
  const response = await apiClient.post('/auth/login', { email, pin });
  return response.data;
};

// Get current user (using token)
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// Update user profile (works for patient)
export const updateUser = async (userId: number, updates: Partial<User>): Promise<User> => {
  const response = await apiClient.put(`/patients/${userId}`, updates);
  return response.data;
};

// Optional: create patient (only doctor and patient)
export const createPatient = async (patientData: Partial<User> & { pin: string }): Promise<User> => {
  const response = await apiClient.post('/patients', patientData);
  return response.data;
};

export const register = async (userData: {
  name: string;
  email: string;
  phone: string;
  pin: string;
  doctorEmail?: string;
}): Promise<{ user: User; token: string }> => {
  console.log('register')
  const response = await apiClient.post('/patient-self/register', userData);
  console.log(response)
  return response.data;
};