import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import ChartCarousel from '../components/ChartCarousel';
import FoodNewsTabs from '../components/FoodNewsTabs';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { mockHealthData } from '../constants/mockData';

const HomeScreen: React.FC = () => {
  const { healthData, addHealthData } = useData();
  const { user } = useAuth();

  // Use mock data if none exists
  const data = healthData.length > 0 ? healthData : mockHealthData;

  const handlePrediction = () => {
    // Mock prediction based on latest data
    const latest = data[0];
    if (!latest) return;
    let risk = 'low';
    if (latest.glucose > 140 || latest.bmi > 30) risk = 'high';
    else if (latest.glucose > 100 || latest.bmi > 25) risk = 'medium';
    Alert.alert('Risk Prediction', `Your current risk level is: ${risk.toUpperCase()}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
        <Text style={styles.riskBadge}>Risk: {user?.riskLevel || 'low'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <ChartCarousel data={data} />
        <TouchableOpacity style={styles.predictionButton} onPress={handlePrediction}>
          <Text style={styles.predictionButtonText}>Predict My Risk</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>Food & News</Text>
        <FoodNewsTabs />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: Colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondaryRed,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  riskBadge: {
    fontSize: 16,
    color: Colors.white,
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primaryRed,
    marginLeft: 20,
    marginBottom: 10,
  },
  predictionButton: {
    backgroundColor: Colors.primaryOrange,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  predictionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;