import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoadScreen from '../screens/LoadScreen';
import LoginSignupScreen from '../screens/LoginSignupScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Load" component={LoadScreen} />
      <Stack.Screen name="Auth" component={LoginSignupScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;