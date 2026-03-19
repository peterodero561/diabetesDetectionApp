import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AnimatedLogo from '../components/AnimatedLogo';
import { Colors } from '../constants/colors';

interface Props {
  navigation: any;
}

const LoadScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Auth'); // go to login/signup stack
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <AnimatedLogo />
      <Text style={styles.title}>Diabetes Monitor</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryRed,
    marginTop: 20,
  },
});

export default LoadScreen;