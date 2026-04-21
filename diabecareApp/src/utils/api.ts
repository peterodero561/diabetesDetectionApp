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
    }
    return Promise.reject(error);
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  type: 'admin' | 'doctor' | 'patient';
  doctor_id?: number;
  created_at: string;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  patient_name?: string;
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
  patient_name?: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
}

export interface PredictResult {
  prediction: number;
  probability: number;
  risk: 'LOW' | 'MODERATE' | 'HIGH';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

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
  updates: Partial<User>
): Promise<User> => {
  const response = await apiClient.put(`/patients/${userId}`, updates);
  return response.data;
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

// ─── Medical Records ──────────────────────────────────────────────────────────

/** Fetch all medical records visible to the logged-in user */
export const getMedicalRecords = async (): Promise<MedicalRecord[]> => {
  const response = await apiClient.get('/medical-records');
  return response.data;
};

/** Fetch medical records for a specific patient */
export const getMedicalRecordsByPatient = async (
  patientId: number
): Promise<MedicalRecord[]> => {
  const response = await apiClient.get(`/medical-records/patient/${patientId}`);
  return response.data;
};

/** Create a new medical record and auto-generate a prediction */
export const createMedicalRecord = async (
  record: Omit<MedicalRecord, 'id' | 'created_at' | 'patient_name'>
): Promise<{ id: number; patient_id: number; risk_level: string }> => {
  const response = await apiClient.post('/medical-records', record);
  return response.data;
};

// ─── Predictions ──────────────────────────────────────────────────────────────

/** Fetch all predictions visible to the logged-in user */
export const getPredictions = async (): Promise<Prediction[]> => {
  const response = await apiClient.get('/prediction-records');
  return response.data;
};

/** Fetch predictions for a specific patient */
export const getPredictionsByPatient = async (
  patientId: number
): Promise<Prediction[]> => {
  const response = await apiClient.get(
    `/prediction-records/patient/${patientId}`
  );
  return response.data;
};

// ─── ML Predict ───────────────────────────────────────────────────────────────

/**
 * Send patient data to the ML service for a live diabetes risk prediction.
 * NOTE: The ML service path is a placeholder – swap out when the real
 *       service is available.
 */
export const predictDiabetesRisk = async (
  patientData: Partial<MedicalRecord>
): Promise<PredictResult> => {
  // TODO: replace '/ml-service/predict-diabetes' with the real ML route
  const response = await apiClient.post(
    '/ml-service/predict-diabetes',
    patientData
  );
  return response.data;
};
