import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Colors } from '../constants/colors';
import ChartCarousel from '../components/ChartCarousel';
import FoodNewsTabs from '../components/FoodNewsTabs';
import { useAuth } from '../context/AuthContext';
import { HealthData } from '../types';
import {
  getMedicalRecords,
  getPredictions,
  predictDiabetesRisk,
  MedicalRecord,
  Prediction,
} from '../utils/api';

const NO_DATA_IMAGE = require('../assets/no_data.png');

// ─── Helpers ─────────────────────────────────────────────────

function recordToHealthData(r: MedicalRecord): HealthData {
  const parts = r.blood_pressure?.split('/') ?? [];
  return {
    date: r.created_at.slice(0, 10),
    bmi: r.bmi,
    glucose: r.glucose,
    systolic: parts[0] ? Number(parts[0]) : undefined,
    diastolic: parts[1] ? Number(parts[1]) : undefined,
  };
}

function riskStyle(level?: string | null) {
  switch ((level ?? '').toUpperCase()) {
    case 'HIGH':
      return { color: Colors.primaryRed, label: 'High' };
    case 'MEDIUM':
    case 'MODERATE':
      return { color: Colors.primaryOrange, label: 'Medium' };
    case 'LOW':
      return { color: Colors.primaryGreen, label: 'Low' };
    default:
      return { color: Colors.darkGray, label: 'Pending' };
  }
}

function getOfflineRisk(source?: Partial<MedicalRecord>) {
  const glucose = Number(source?.glucose ?? 0);
  const bmi = Number(source?.bmi ?? 0);

  if (glucose > 140 || bmi > 30) return 'HIGH';
  if (glucose > 100 || bmi > 25) return 'MEDIUM';
  return 'LOW';
}

// ─── Component ───────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [chartData, setChartData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [predicting, setPredicting] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    patient_name: '',
    pregnancies: '',
    glucose: '',
    blood_pressure: '',
    skin_thickness: '',
    insulin: '',
    bmi: '',
    diabetes_pedigree_function: '',
    age: '',
  });

  // ── Fetch Data ─────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [medRecords, predictions] = await Promise.all([
        getMedicalRecords(),
        getPredictions(),
      ]);

      setRecords(medRecords);

      if (medRecords.length >= 4) {
        setChartData(medRecords.map(recordToHealthData).reverse());
      } else {
        setChartData([]);
      }

      setLatestPrediction(predictions.length > 0 ? predictions[0] : null);
    } catch (err: any) {
      console.warn('Fetch error:', err?.message ?? err);
      setRecords([]);
      setChartData([]);
      setLatestPrediction(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // ── Prediction ─────────────────────────────────────────────

  const handlePrediction = async (input?: Partial<MedicalRecord>) => {
    if (!input) {
      Alert.alert('No Data', 'Please enter data to predict.');
      return;
    }

    setPredicting(true);
    try {
      const result = await predictDiabetesRisk(input);
      const prob = Math.round((result.probability ?? 0) * 100);

      Alert.alert(
        'Risk Prediction',
        `Risk level: ${result.risk}\nProbability: ${prob}%`
      );
    } catch (err) {
      const fallback = getOfflineRisk(input);

      Alert.alert(
        'Offline Prediction',
        `Estimated risk: ${fallback}`
      );
    } finally {
      setPredicting(false);
    }
  };

  const submitPrediction = () => {
    const payload = {
      patient_name: formData.patient_name,
      pregnancies: Number(formData.pregnancies),
      glucose: Number(formData.glucose),
      blood_pressure: formData.blood_pressure,
      skin_thickness: Number(formData.skin_thickness),
      insulin: Number(formData.insulin),
      bmi: Number(formData.bmi),
      diabetes_pedigree_function: Number(formData.diabetes_pedigree_function),
      age: Number(formData.age),
    };

    setShowModal(false);
    handlePrediction(payload);
  };

  const latestRecord = records[0];
  const risk = riskStyle(latestPrediction?.risk_level);

  // ── UI ────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.name || 'User'} 👋
          </Text>

          <View style={[styles.riskBadge, { backgroundColor: risk.color }]}>
            <Text style={styles.riskBadgeText}>
              Risk: {risk.label}
            </Text>
          </View>
        </View>

        {/* Charts / No Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trends</Text>

          {chartData.length >= 4 ? (
            <ChartCarousel data={chartData} />
          ) : (
            <View style={styles.noDataCard}>
              <Image source={NO_DATA_IMAGE} style={styles.noDataImage} />
              <Text>No data yet</Text>
            </View>
          )}
        </View>

        {/* Predict Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.predictionButton}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.predictionButtonText}>
              🔬 Predict My Risk
            </Text>
          </TouchableOpacity>
        </View>

        <FoodNewsTabs />
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Enter Health Data</Text>

              {Object.keys(formData).map((key) => (
                <View key={key}>
                  <Text>{key}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData[key]}
                    onChangeText={(text) =>
                      setFormData({ ...formData, [key]: text })
                    } 
                  />
                </View>
              ))}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={{ color: 'white' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={submitPrediction}
                >
                  <Text style={{ color: 'white' }}>Predict</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },

  greeting: { fontSize: 18 },

  riskBadge: { padding: 10, borderRadius: 20 },
  riskBadgeText: { color: 'white' },

  section: { padding: 20 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold' },

  noDataCard: { alignItems: 'center' },
  noDataImage: { width: 120, height: 120 },

  predictionButton: {
    backgroundColor: Colors.primaryOrange,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  predictionButtonText: { color: 'white' },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },

  modalTitle: { fontSize: 18, marginBottom: 10 },

  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cancelBtn: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 8,
  },

  submitBtn: {
    backgroundColor: Colors.primaryGreen,
    padding: 10,
    borderRadius: 8,
  },
});

export default HomeScreen;