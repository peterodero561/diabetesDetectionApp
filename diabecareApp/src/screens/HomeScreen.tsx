import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import ChartCarousel from '../components/ChartCarousel';
import FoodNewsTabs from '../components/FoodNewsTabs';
import { useAuth } from '../context/AuthContext';
import { mockHealthData } from '../constants/mockData';
import { HealthData } from '../types';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TOKEN_KEY } from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MedicalRecord {
  id: number;
  patient_id: number;
  pregnancies: number;
  glucose: number;
  blood_pressure: string;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree_function: number;
  age: number;
  created_at: string;
}

interface MedicalForm {
  pregnancies: string;
  glucose: string;
  blood_pressure: string;
  skin_thickness: string;
  insulin: string;
  bmi: string;
  diabetes_pedigree_function: string;
  age: string;
}

interface PredictionResult {
  prediction: number;
  probability: number;
  risk: 'LOW' | 'MODERATE' | 'HIGH';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  LOW:      { color: Colors.primaryGreen,  bg: '#e8f8f5', label: 'Low Risk',      emoji: '✅' },
  MODERATE: { color: Colors.primaryOrange, bg: '#fef3e2', label: 'Moderate Risk', emoji: '⚠️' },
  HIGH:     { color: Colors.primaryRed,    bg: '#fde8ea', label: 'High Risk',      emoji: '🚨' },
} as const;

const EMPTY_FORM: MedicalForm = {
  pregnancies: '',
  glucose: '',
  blood_pressure: '',
  skin_thickness: '',
  insulin: '',
  bmi: '',
  diabetes_pedigree_function: '',
  age: '',
};

const FORM_FIELDS: {
  key: keyof MedicalForm;
  label: string;
  placeholder: string;
  unit: string;
  keyboard: 'numeric' | 'decimal-pad' | 'default';
}[] = [
  { key: 'glucose',                  label: 'Glucose',                    placeholder: 'e.g. 95',    unit: 'mg/dL',  keyboard: 'numeric' },
  { key: 'bmi',                      label: 'BMI',                        placeholder: 'e.g. 22.5',  unit: 'kg/m²',  keyboard: 'decimal-pad' },
  { key: 'blood_pressure',           label: 'Blood Pressure',             placeholder: 'e.g. 120/80',unit: 'mmHg',   keyboard: 'default' },
  { key: 'age',                      label: 'Age',                        placeholder: 'e.g. 35',    unit: 'yrs',    keyboard: 'numeric' },
  { key: 'pregnancies',              label: 'Pregnancies',                placeholder: 'e.g. 0',     unit: '#',      keyboard: 'numeric' },
  { key: 'insulin',                  label: 'Insulin',                    placeholder: 'e.g. 80',    unit: 'µU/mL',  keyboard: 'numeric' },
  { key: 'skin_thickness',           label: 'Skin Thickness',             placeholder: 'e.g. 20',    unit: 'mm',     keyboard: 'numeric' },
  { key: 'diabetes_pedigree_function', label: 'Diabetes Pedigree Function', placeholder: 'e.g. 0.47',unit: '',       keyboard: 'decimal-pad' },
];

function recordToForm(r: MedicalRecord): MedicalForm {
  return {
    pregnancies:               String(r.pregnancies               ?? ''),
    glucose:                   String(r.glucose                   ?? ''),
    blood_pressure:            r.blood_pressure                   ?? '',
    skin_thickness:            String(r.skin_thickness            ?? ''),
    insulin:                   String(r.insulin                   ?? ''),
    bmi:                       String(r.bmi                       ?? ''),
    diabetes_pedigree_function:String(r.diabetes_pedigree_function?? ''),
    age:                       String(r.age                       ?? ''),
  };
}

function medicalRecordToHealthData(record: MedicalRecord): HealthData {
  return {
    date:    record.created_at.slice(0, 10),
    bmi:     record.bmi,
    glucose: record.glucose,
  };
}

function parseBloodPressure(bp: string): number {
  if (!bp) return 0;
  return parseInt(bp.split('/')[0], 10) || 0;
}

const NO_DATA_IMAGE = require('../assets/no_data.png');

// ─── Component ────────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  // Records
  const [medicalRecords, setMedicalRecords]   = useState<MedicalRecord[]>([]);
  const [chartData, setChartData]             = useState<HealthData[]>([]);
  const [loadingRecords, setLoadingRecords]   = useState(false);
  const [refreshing, setRefreshing]           = useState(false);

  // Medical-record form modal
  const [showForm, setShowForm]               = useState(false);
  const [form, setForm]                       = useState<MedicalForm>(EMPTY_FORM);
  const [submittingRecord, setSubmittingRecord] = useState(false);

  // Prediction result modal
  const [showResult, setShowResult]           = useState(false);
  const [predicting, setPredicting]           = useState(false);
  const [prediction, setPrediction]           = useState<PredictionResult | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // ── API helper ──────────────────────────────────────────────────────────────

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ── Fetch medical records ───────────────────────────────────────────────────

  const fetchMedicalRecords = useCallback(async () => {
    if (!user) return;
    setLoadingRecords(true);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get<MedicalRecord[]>(`${API_BASE_URL}/medical-records`, { headers });
      const records: MedicalRecord[] = res.data;
      setMedicalRecords(records);

      if (records.length >= 4) {
        const sorted = [...records]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(-10); // last 10 for the chart
        setChartData(sorted.map(medicalRecordToHealthData));
      } else {
        setChartData([]); // triggers nodata.png
      }
    } catch (err: any) {
      console.warn('Could not fetch medical records:', err?.message);
      setChartData([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [user]);

  useEffect(() => { fetchMedicalRecords(); }, [fetchMedicalRecords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMedicalRecords();
    setRefreshing(false);
  };

  // ── Open form (autofill if record exists) ──────────────────────────────────

  const openForm = () => {
    if (medicalRecords.length > 0) {
      // Autofill with the most recent record
      setForm(recordToForm(medicalRecords[0]));
    } else {
      setForm(EMPTY_FORM);
    }
    setShowForm(true);
  };

  // ── Submit medical record then predict ────────────────────────────────────

  const handleSubmitAndPredict = async () => {
    // Validate required fields
    const required: (keyof MedicalForm)[] = ['glucose', 'bmi', 'age'];
    const missing = required.filter(k => !form[k]?.trim());
    if (missing.length > 0) {
      Alert.alert('Missing fields', `Please fill in: ${missing.join(', ')}`);
      return;
    }

    setSubmittingRecord(true);
    try {
      const headers  = await getAuthHeaders();
      const patientId = user?.id;

      const recordPayload = {
        patient_id:                patientId,
        pregnancies:               parseInt(form.pregnancies)               || 0,
        glucose:                   parseFloat(form.glucose),
        blood_pressure:            form.blood_pressure                      || '0',
        skin_thickness:            parseInt(form.skin_thickness)            || 0,
        insulin:                   parseInt(form.insulin)                   || 0,
        bmi:                       parseFloat(form.bmi),
        diabetes_pedigree_function:parseFloat(form.diabetes_pedigree_function) || 0,
        age:                       parseInt(form.age),
      };

      // Save the medical record first
      await axios.post(`${API_BASE_URL}/medical-records`, recordPayload, { headers });

      setShowForm(false);

      // Refresh records in background
      await fetchMedicalRecords();

      // Now call ML service
      await runPrediction(recordPayload);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        'Failed to save record. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmittingRecord(false);
    }
  };

  // ── Run prediction (reusable) ─────────────────────────────────────────────

  const runPrediction = async (recordData: {
    glucose: number; bmi: number; age: number;
    pregnancies: number; insulin: number;
    skin_thickness: number; diabetes_pedigree_function: number;
    blood_pressure: string;
  }) => {
    setPredictionError(null);
    setPredicting(true);
    try {
      const headers = await getAuthHeaders();
      const mlPayload = {
        Pregnancies:               recordData.pregnancies,
        Glucose:                   recordData.glucose,
        BloodPressure:             parseBloodPressure(recordData.blood_pressure),
        SkinThickness:             recordData.skin_thickness,
        Insulin:                   recordData.insulin,
        BMI:                       recordData.bmi,
        DiabetesPedigreeFunction:  recordData.diabetes_pedigree_function,
        Age:                       recordData.age,
      };
      const res = await axios.post<PredictionResult>(
        `${API_BASE_URL}/ml-service/predict-diabetes`,
        mlPayload,
        { headers }
      );
      setPrediction(res.data);
    } catch (err: any) {
      setPredictionError(
        err?.response?.data?.error   ||
        err?.response?.data?.message ||
        'Prediction service unavailable. Please try again later.'
      );
    } finally {
      setPredicting(false);
      setShowResult(true);
    }
  };

  // ── Handle the "Predict My Risk" button press ─────────────────────────────

  const handlePredictPress = () => {
    // Always open the form — prefilled if records exist, empty if first time
    openForm();
  };

  const latestRecord = medicalRecords[0] ?? null;
  const hasEnoughData = chartData.length >= 4;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primaryGreen]}
          tintColor={Colors.primaryGreen}
        />
      }
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'} 👋</Text>
          <Text style={styles.subGreeting}>
            {latestRecord
              ? `Last check-in: ${latestRecord.created_at.slice(0, 10)}`
              : 'No records yet — add one below'}
          </Text>
        </View>
        {latestRecord && (
          <View style={styles.quickStats}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{latestRecord.glucose}</Text>
              <Text style={styles.statLabel}>Glucose</Text>
            </View>
            <View style={[styles.statPill, { marginLeft: 8 }]}>
              <Text style={styles.statValue}>{latestRecord.bmi?.toFixed(1)}</Text>
              <Text style={styles.statLabel}>BMI</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Statistics / Chart ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          {loadingRecords && (
            <ActivityIndicator size="small" color={Colors.primaryGreen} />
          )}
        </View>

        {hasEnoughData ? (
          <ChartCarousel data={chartData} />
        ) : (
          <View style={styles.noDataContainer}>
            <Image
              source={NO_DATA_IMAGE}
              style={styles.noDataImage}
              resizeMode="contain"
            />
            <Text style={styles.noDataText}>
              {loadingRecords
                ? 'Loading your records…'
                : `Add at least 4 records to see your chart.\nYou have ${medicalRecords.length} so far.`}
            </Text>
          </View>
        )}
      </View>

      {/* ── Predict button ─────────────────────────────────────────────────── */}
      <View style={styles.predictSection}>
        <TouchableOpacity
          style={[styles.predictionButton, predicting && styles.predictionButtonDisabled]}
          onPress={handlePredictPress}
          disabled={predicting}
          activeOpacity={0.85}
        >
          {predicting ? (
            <View style={styles.buttonInner}>
              <ActivityIndicator color={Colors.white} size="small" style={{ marginRight: 8 }} />
              <Text style={styles.predictionButtonText}>Analysing…</Text>
            </View>
          ) : (
            <View style={styles.buttonInner}>
              <Text style={styles.buttonIcon}>🔬</Text>
              <Text style={styles.predictionButtonText}>Predict My Risk</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Food & News ────────────────────────────────────────────────────── */}
      <View style={[styles.section, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>Food &amp; News</Text>
        <FoodNewsTabs />
      </View>

      {/* ══ MODAL: Medical Record Form ══════════════════════════════════════ */}
      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={() => !submittingRecord && setShowForm(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.formCard}>
            {/* Header */}
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>
                  {medicalRecords.length > 0 ? 'Update Health Data' : 'Add Health Data'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {medicalRecords.length > 0
                    ? 'Pre-filled with your latest record — update if needed'
                    : 'Enter your current medical data'}
                </Text>
              </View>
              {!submittingRecord && (
                <TouchableOpacity onPress={() => setShowForm(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {FORM_FIELDS.map((field) => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.fieldLabel}>
                    {field.label}
                    {['glucose', 'bmi', 'age'].includes(field.key) && (
                      <Text style={styles.requiredStar}> *</Text>
                    )}
                  </Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={field.placeholder}
                      placeholderTextColor="#aaa"
                      keyboardType={field.keyboard}
                      value={form[field.key]}
                      onChangeText={(v) => setForm((prev) => ({ ...prev, [field.key]: v }))}
                      editable={!submittingRecord}
                    />
                    {field.unit ? (
                      <Text style={styles.unitLabel}>{field.unit}</Text>
                    ) : null}
                  </View>
                </View>
              ))}

              <Text style={styles.requiredNote}>* Required fields</Text>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, submittingRecord && styles.submitBtnDisabled]}
                onPress={handleSubmitAndPredict}
                disabled={submittingRecord}
                activeOpacity={0.85}
              >
                {submittingRecord ? (
                  <View style={styles.buttonInner}>
                    <ActivityIndicator color={Colors.white} size="small" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Saving & Predicting…</Text>
                  </View>
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonIcon}>🔬</Text>
                    <Text style={styles.submitBtnText}>Save &amp; Predict</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ MODAL: Prediction Result ════════════════════════════════════════ */}
      <Modal
        visible={showResult}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultCard}>
            {predictionError ? (
              <>
                <Text style={styles.modalEmoji}>⚠️</Text>
                <Text style={styles.modalTitle}>Could Not Predict</Text>
                <Text style={styles.modalBody}>{predictionError}</Text>
              </>
            ) : prediction ? (
              <>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: RISK_CONFIG[prediction.risk].bg },
                  ]}
                >
                  <Text style={styles.modalEmoji}>
                    {RISK_CONFIG[prediction.risk].emoji}
                  </Text>
                  <Text
                    style={[styles.riskLabel, { color: RISK_CONFIG[prediction.risk].color }]}
                  >
                    {RISK_CONFIG[prediction.risk].label}
                  </Text>
                </View>

                <Text style={styles.modalTitle}>Prediction Result</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>
                      {(prediction.probability * 100).toFixed(1)}%
                    </Text>
                    <Text style={styles.statBoxLabel}>Probability</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>
                      {prediction.prediction === 1 ? 'Positive' : 'Negative'}
                    </Text>
                    <Text style={styles.statBoxLabel}>Outcome</Text>
                  </View>
                </View>

                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${prediction.probability * 100}%` as any,
                        backgroundColor: RISK_CONFIG[prediction.risk].color,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.modalDisclaimer}>
                  This is an AI-generated estimate. Please consult your doctor
                  for professional medical advice.
                </Text>
              </>
            ) : null}

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => {
                setShowResult(false);
                setPrediction(null);
                setPredictionError(null);
              }}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondaryRed,
  },
  greeting:    { fontSize: 20, fontWeight: 'bold', color: Colors.darkGray },
  subGreeting: { fontSize: 12, color: Colors.darkGray, opacity: 0.6, marginTop: 2 },
  quickStats:  { flexDirection: 'row' },
  statPill: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  statValue: { fontSize: 15, fontWeight: 'bold', color: Colors.primaryGreen },
  statLabel: { fontSize: 10, color: Colors.darkGray, opacity: 0.7 },

  /* Sections */
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primaryRed,
    marginLeft: 20,
    marginBottom: 10,
  },

  /* No-data placeholder */
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  noDataImage: {
    width: 200,
    height: 160,
    marginBottom: 12,
    opacity: 0.85,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.darkGray,
    opacity: 0.55,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Predict button */
  predictSection: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  predictionButton: {
    backgroundColor: Colors.primaryOrange,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  predictionButtonDisabled: { opacity: 0.7 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonIcon:  { fontSize: 18 },
  predictionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },

  /* ── Form Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    maxHeight: '92%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  formTitle:    { fontSize: 20, fontWeight: 'bold', color: Colors.darkGray },
  formSubtitle: {
    fontSize: 12,
    color: Colors.darkGray,
    opacity: 0.55,
    marginTop: 3,
    maxWidth: 240,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: Colors.darkGray, fontWeight: 'bold' },

  formField:  { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.darkGray, marginBottom: 6 },
  requiredStar: { color: Colors.primaryRed },
  inputRow:   { flexDirection: 'row', alignItems: 'center' },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.darkGray,
    backgroundColor: Colors.lightGray,
  },
  unitLabel: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.darkGray,
    opacity: 0.5,
    width: 44,
  },
  requiredNote: {
    fontSize: 11,
    color: Colors.darkGray,
    opacity: 0.4,
    marginBottom: 16,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: Colors.primaryGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    elevation: 2,
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },

  /* ── Result Modal ── */
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    margin: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 12,
  },
  modalEmoji:  { fontSize: 32, marginBottom: 4 },
  riskLabel:   { fontSize: 16, fontWeight: 'bold' },
  modalTitle:  { fontSize: 20, fontWeight: 'bold', color: Colors.darkGray, marginBottom: 16 },
  modalBody: {
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    opacity: 0.8,
  },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 16, width: '100%' },
  statBox: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statBoxValue: { fontSize: 18, fontWeight: 'bold', color: Colors.darkGray },
  statBoxLabel: { fontSize: 11, color: Colors.darkGray, opacity: 0.6, marginTop: 2 },
  progressBg: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  modalDisclaimer: {
    fontSize: 11,
    color: Colors.darkGray,
    opacity: 0.5,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  modalClose: {
    backgroundColor: Colors.primaryGreen,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  modalCloseText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
});

export default HomeScreen;
