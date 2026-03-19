import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useData } from '../context/DataContext';
import { Colors } from '../constants/colors';

const SyncButton: React.FC = () => {
  const { syncData, pendingSync } = useData();

  return (
    <TouchableOpacity style={styles.button} onPress={syncData}>
      <Text style={styles.text}>Sync ({pendingSync.length})</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  text: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default SyncButton;