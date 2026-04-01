import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TOKEN_KEY } from './constants';
import { User } from '../types'; // adjust path as needed

// Helper to get stored token
const getToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

// Helper to handle fetch with JSON and optional auth
const request = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: any,
  requiresAuth = false
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = await getToken();
    if (!token) throw new Error('No auth token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const responseData = await response.json();

  if (!response.ok) {
    // You can throw a custom error with message from server
    throw new Error(responseData.message || 'API request failed');
  }

  return responseData;
};

// ===== AUTH ENDPOINTS =====

interface LoginResponse {
  user: User;
  token: string;
}

export const login = async (email: string, pin: string): Promise<LoginResponse> => {
  // Assuming your API expects email and password (pin)
  return request<LoginResponse>('/auth/login', 'POST', { email, password: pin });
};

interface RegisterResponse {
  user: User;
  token: string;
}

export const register = async (userData: Partial<User>): Promise<RegisterResponse> => {
  // Expect userData to contain email, name, pin, etc.
  return request<RegisterResponse>('/auth/register', 'POST', userData);
};

// ===== USER ENDPOINTS =====

export const getCurrentUser = async (): Promise<User> => {
  return request<User>('/users/me', 'GET', undefined, true);
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  return request<User>(`/users/${userId}`, 'PATCH', updates, true);
};