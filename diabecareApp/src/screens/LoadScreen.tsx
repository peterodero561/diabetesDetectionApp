import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MotiView, MotiText } from 'moti';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoadScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const user = await AsyncStorage.getItem('diabetesMonitor_user');
        
        if (user) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          );
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            })
          );
        }
      } catch (error) {
        console.error('Error reading storage', error);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          })
        );
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#fee2e2', '#fff3e0', '#e4f5e4']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <MotiView
          from={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 500 }}
          style={styles.logoContainer}
        >
          <View style={styles.outerRing}>
            <MotiView
              animate={{ rotate: '360deg' }}
              transition={{ loop: true, duration: 2000, repeatReverse: false }}
              style={styles.rotatingRing}
            />
            <View style={styles.innerCircle}>
              <Feather name="activity" size={48} color="#ef4444" />
            </View>
          </View>
        </MotiView>

        {/* App Name with Gradient - Fixed version */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 800, delay: 200 }}
          style={styles.titleWrapper}
        >
        <MaskedView
          style={styles.maskedTitle}
          maskElement={
            <Text style={styles.maskText}>
              DiabeCare
            </Text>
          }
        >
          <LinearGradient
            colors={['#ef4444', '#f97316', '#22c55e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          />
        </MaskedView>
        </MotiView>

        {/* Subtitle - Only show this */}
        <MotiText
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 500 }}
          style={styles.subtitle}
        >
          Your Health, Our Priority
        </MotiText>

        {/* Animated Icons */}
        <View style={styles.iconRow}>
          <MotiView
            animate={{ translateY: [0, -10, 0] }}
            transition={{ loop: true, duration: 1500, delay: 0 }}
          >
            <Feather name="heart" size={32} color="#ef4444" />
          </MotiView>
          <MotiView
            animate={{ translateY: [0, -10, 0] }}
            transition={{ loop: true, duration: 1500, delay: 500 }}
          >
            <Feather name="droplet" size={32} color="#f97316" />
          </MotiView>
          <MotiView
            animate={{ translateY: [0, -10, 0] }}
            transition={{ loop: true, duration: 1500, delay: 1000 }}
          >
            <Feather name="activity" size={32} color="#22c55e" />
          </MotiView>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 32,
  },
  outerRing: {
    width: 128,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotatingRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 8,
    borderTopColor: '#ef4444',
    borderRightColor: '#f97316',
    borderBottomColor: '#22c55e',
    borderLeftColor: '#fecaca',
  },
  innerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Separate style for gradient text mask
  gradientTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    // Make text transparent so gradient shows through
    opacity: 1,
  },
titleWrapper: {
  alignItems: 'center',
  justifyContent: 'center',
},
maskedTitle: {
  width: 260,
  height: 60,
},
maskCenter: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
maskText: {
  fontSize: 36,
  fontWeight: 'bold',
  textAlign: 'center',
  color: 'black',
},
gradientFill: {
  flex: 1,
},

  gradientBackground: {
    width: '100%',
    height: 43, // Height should match text size approximately
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  iconRow: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 32,
    justifyContent: 'center',
  },
});