import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

const backgroundImage = require('../assets/login-pic.png');

const LoginSignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const { signIn, signUp, isLoading } = useAuth();

  // Helper: format name – trim, remove extra spaces, capitalize each word
  const formatName = (name: string): string => {
    return name
      .trim()
      .replace(/\s+/g, ' ')               // multiple spaces → single space
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleLogin = async () => {
    if (!email || !pin) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Please enter email and PIN' });
      return;
    }
    const success = await signIn(email, pin);
    if (success) {
      navigation.replace('Main');
    }
  };

  const handleSignup = async () => {
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !pin) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Please fill all required fields' });
      return;
    }
    if (pin.length < 4) {
      Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'PIN must be at least 4 digits' });
      return;
    }

    // Format first and last name, then combine
    const formattedFirstName = formatName(firstName);
    const formattedLastName = formatName(lastName);
    const fullName = `${formattedFirstName} ${formattedLastName}`;

    const success = await signUp({
      name: fullName,
      email,
      phone,
      pin,
      doctorEmail: doctorEmail.trim() || undefined,
    });
    if (success) {
      navigation.replace('Main');
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <BlurView intensity={90} tint="light" style={styles.blurContainer}>
          <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name *"
                placeholderTextColor="#666"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name *"
                placeholderTextColor="#666"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="PIN * (4+ digits)"
            placeholderTextColor="#666"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Doctor's Email (optional)"
              placeholderTextColor="#666"
              value={doctorEmail}
              onChangeText={setDoctorEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? "First time? Sign up" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </BlurView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    width: '85%',
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryRed,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.darkGray,
  },
  button: {
    backgroundColor: Colors.primaryGreen,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: Colors.primaryOrange,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});

export default LoginSignupScreen;