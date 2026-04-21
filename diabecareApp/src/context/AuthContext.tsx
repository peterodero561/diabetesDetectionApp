import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import * as api from '../utils/api';
import { TOKEN_KEY } from '../utils/constants';
import Toast from 'react-native-toast-message';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, pin: string) => Promise<boolean>;
  signUp: (userData: {
    name: string;
    email: string;
    phone: string;
    pin: string;
    doctorEmail?: string;
  }) => Promise<boolean>;
  signOut: () => void;
  updateUser: (updates: Partial<Pick<User, 'name' | 'email' | 'phone'>>) => Promise<void>;
  refreshUser: () => Promise<void>;  // <-- new method
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: fetch full user from API and update state
  const fetchAndSetUser = useCallback(async () => {
    try {
      const fullUser = await api.getCurrentUser();
      setUser(fullUser);
      return fullUser;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }, []);

  // Bootstrap: check token and load user
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          await fetchAndSetUser();
        }
      } catch (error) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [fetchAndSetUser]);

  const signIn = async (email: string, pin: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: partialUser, token } = await api.login(email, pin);
      await AsyncStorage.setItem(TOKEN_KEY, token);
      // Now fetch the full user profile
      const fullUser = await fetchAndSetUser();
      Toast.show({ type: 'success', text1: 'Welcome back!', text2: `Hello ${fullUser?.name || partialUser.name}` });
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'Login failed. Please check your connection.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: message,
        visibilityTime: 4000,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData: {
    name: string;
    email: string;
    phone: string;
    pin: string;
    doctorEmail?: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: partialUser, token } = await api.register(userData);
      await AsyncStorage.setItem(TOKEN_KEY, token);
      // Fetch full user after registration
      await fetchAndSetUser();
      Toast.show({ type: 'success', text1: 'Account created!', text2: `Welcome ${partialUser.name}` });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      Toast.show({ type: 'error', text1: 'Signup Error', text2: message });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    Toast.show({ type: 'info', text1: 'Signed out', text2: 'See you next time!' });
    setIsLoading(false);
  };

  const updateUser = async (
    updates: Partial<Pick<User, 'name' | 'email' | 'phone'>>
  ) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await api.updateUser(user.id, updates);
      // Refresh user from server to get latest data
      await fetchAndSetUser();
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Expose refreshUser for manual updates (e.g., on screen focus)
  const refreshUser = async () => {
    if (!user) return;
    await fetchAndSetUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};