import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, HealthData } from '../types';

const STORAGE_KEYS = {
  USER: 'user',
  HEALTH_DATA: 'health_data',
  PENDING_SYNC: 'pending_sync',
};

export const saveUser = async (user: User) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user', e);
  }
};

export const loadUser = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load user', e);
    return null;
  }
};

export const saveHealthData = async (data: HealthData[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_DATA, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save health data', e);
  }
};

export const loadHealthData = async (): Promise<HealthData[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_DATA);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load health data', e);
    return [];
  }
};

// For sync simulation: store unsynced data
export const savePendingSync = async (pending: any[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
  } catch (e) {
    console.error('Failed to save pending sync', e);
  }
};

export const loadPendingSync = async (): Promise<any[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load pending sync', e);
    return [];
  }
};