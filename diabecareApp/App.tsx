import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import AppNavigator from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppNavigator />
      </DataProvider>
    </AuthProvider>
  );
}