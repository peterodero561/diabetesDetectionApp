import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Optionally show a loading indicator
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;