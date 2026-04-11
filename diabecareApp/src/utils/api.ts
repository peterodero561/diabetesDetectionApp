import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, API_BASE_URL } from './constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) await AsyncStorage.removeItem(TOKEN_KEY);
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  type: 'admin' | 'doctor' | 'patient';
  doctor_id?: number;
  doctor_name?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  pregnancies: number;
  glucose: number;
  blood_pressure: string;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree_function: number;
  age: number;
  created_at: string;
}

export interface Prediction {
  id: number;
  patient_id: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
}

export const login = async (
  email: string,
  pin: string
): Promise<{ user: User; token: string }> => {
  const response = await apiClient.post('/auth/login', { email, pin });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const updateUser = async (
  userId: number,
  updates: Partial<Pick<User, 'name' | 'email' | 'phone'>>
): Promise<void> => {
  await apiClient.put(`/patients/${userId}`, updates);
};

export const register = async (userData: {
  name: string;
  email: string;
  phone: string;
  pin: string;
  doctorEmail?: string;
}): Promise<{ user: User; token: string }> => {
  const response = await apiClient.post('/patient-self/register', userData);
  return response.data;
};

// Fetch all medical records for the logged-in patient
export const getMyMedicalRecords = async (): Promise<MedicalRecord[]> => {
  const response = await apiClient.get('/medical-records');
  return response.data;
};

// Fetch latest prediction for the logged-in patient
export const getMyPredictions = async (): Promise<Prediction[]> => {
  const response = await apiClient.get('/prediction-records');
  return response.data;
};