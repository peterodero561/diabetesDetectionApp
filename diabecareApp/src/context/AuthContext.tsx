import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import * as api from '../utils/api';      // Assume this module contains login, register, getCurrentUser
import { TOKEN_KEY } from '../utils/constants'; // e.g., 'authToken'

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, pin: string) => Promise<boolean>;
  signUp: (userData: Partial<User>) => Promise<boolean>;
  signOut: () => void;
  updateUser: (updated: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app start, try to load user from token
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const userData = await api.getCurrentUser(); // fetch user profile using token
          setUser(userData);
        }
      } catch (error) {
        // Token invalid or network error – clear token
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
      return true;
    } catch (error) {
      // Handle error (show alert, etc.)
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: newUser, token } = await api.register(userData);
      await AsyncStorage.setItem(TOKEN_KEY, token);
      setUser(newUser);
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsLoading(false);
  };

  const updateUser = async (updated: Partial<User>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser = await api.updateUser(user.id, updated);
      setUser(updatedUser);
    } catch (error) {
      // Handle error
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