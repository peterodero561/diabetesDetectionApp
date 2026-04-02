import React, { createContext, useState, useContext, useEffect, use } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types'; // adjust path
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
  updateUser: (updates: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on app start
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const userData = await api.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth bootstrap error:', error);
        await AsyncStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const signIn = async (email: string, pin: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: userData, token } = await api.login(email, pin);
      await AsyncStorage.setItem(TOKEN_KEY, token);
      setUser(userData);
      Toast.show({ type: 'success', text1: 'Welcome back!', text2: `Hello ${userData.name}` });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      Toast.show({ type: 'error', text1: 'Login Error', text2: message });
      console.log('here')
      console.error('Login error:', error.response?.data?.message || error.message);
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
      console.log('signUp')
      const { user: newUser, token } = await api.register(userData);
      console.log(token)
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('after aync')
      setUser(newUser);
      Toast.show({ type: 'success', text1: 'Account created!', text2: `Welcome ${newUser.name}` });
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

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser = await api.updateUser(user.id, updates);
      setUser(updatedUser);
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};