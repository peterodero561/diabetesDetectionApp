import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

const AnimatedLogo: React.FC = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Image
        source={{ uri: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Diabetes+App' }}
        style={styles.logo}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
});

export default AnimatedLogo;