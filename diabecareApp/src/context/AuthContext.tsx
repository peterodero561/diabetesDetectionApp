import React, { createContext, useState, useContext, useEffect } from 'react';
import { loadUser, saveUser } from '../utils/storage';
import { User } from '../types';

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

  useEffect(() => {
    const bootstrap = async () => {
      const storedUser = await loadUser();
      setUser(storedUser);
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const signIn = async (email: string, pin: string) => {
    // Mock sign in – in real app verify with backend
    if (pin === '1234') { // simple mock
      const mockUser: User = {
        id: '1',
        email,
        name: 'John Doe',
        riskLevel: 'medium',
        doctorName: 'Dr. Smith',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '+254700000000',
      };
      await saveUser(mockUser);
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const signUp = async (userData: Partial<User>) => {
    // Create new user with default risk level
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email || '',
      name: userData.name || '',
      riskLevel: 'low', // default
      ...userData,
    };
    await saveUser(newUser);
    setUser(newUser);
    return true;
  };

  const signOut = async () => {
    await saveUser(null as any); // clear
    setUser(null);
  };

  const updateUser = async (updated: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    await saveUser(newUser);
    setUser(newUser);
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