import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import SyncButton from '../components/SyncButton';
import * as ImagePicker from 'expo-image-picker';
import { getMyMedicalRecords, getMyPredictions, MedicalRecord, Prediction } from '../utils/api';

const ProfileScreen: React.FC = () => {
  const { user, updateUser, signOut, isLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [latestRecord, setLatestRecord] = useState<MedicalRecord | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [loadingMedical, setLoadingMedical] = useState(false);

  // Only fetch medical data for patients
  useEffect(() => {
    if (user?.type !== 'patient') return;
    const fetchMedicalData = async () => {
      setLoadingMedical(true);
      try {
        const [records, predictions] = await Promise.all([
          getMyMedicalRecords(),
          getMyPredictions(),
        ]);
        if (records.length > 0) setLatestRecord(records[0]); // already DESC
        if (predictions.length > 0) setLatestPrediction(predictions[0]);
      } catch (err) {
        console.error('Failed to fetch medical data', err);
      } finally {
        setLoadingMedical(false);
      }
    };
    fetchMedicalData();
  }, [user]);

  // Keep form in sync if user changes
  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    // Note: profile pic upload requires backend storage support (e.g. S3/Cloudinary)
    // For now we just show a local preview
    if (!result.canceled) {
      Alert.alert('Note', 'Profile picture upload not yet connected to backend.');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    await updateUser({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setEditing(false);
  };

  const getRiskColor = (level?: string) => {
    if (level === 'HIGH') return Colors.primaryRed;
    if (level === 'MEDIUM') return Colors.primaryOrange;
    return Colors.primaryGreen;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Picture */}
      <View style={styles.profilePicContainer}>
        <TouchableOpacity onPress={pickImage} disabled={!editing}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User' }}
            style={styles.profilePic}
          />
          {editing && <Text style={styles.editPicText}>Change Photo</Text>}
        </TouchableOpacity>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Name</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
          ) : (
            <Text style={styles.value}>{user?.name}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{user?.email}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(t) => setForm({ ...form, phone: t })}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{user?.phone || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Account Type</Text>
          <Text style={styles.value}>{user?.type?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Medical Info — patients only */}
      {user?.type === 'patient' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          {loadingMedical ? (
            <ActivityIndicator color={Colors.primaryGreen} />
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Risk Level</Text>
                <Text style={[styles.value, { color: getRiskColor(latestPrediction?.risk_level) }]}>
                  {latestPrediction?.risk_level || 'No data'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Latest BMI</Text>
                <Text style={styles.value}>
                  {latestRecord?.bmi?.toFixed(1) || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Latest Glucose</Text>
                <Text style={styles.value}>
                  {latestRecord?.glucose ? `${latestRecord.glucose} mg/dL` : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Blood Pressure</Text>
                <Text style={styles.value}>
                  {latestRecord?.blood_pressure || 'N/A'}
                </Text>
              </View>
              {user?.doctor_id && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Doctor ID</Text>
                  <Text style={styles.value}>#{user.doctor_id}</Text>
                </View>
              )}
              {!latestRecord && (
                <Text style={styles.noDataText}>
                  No medical records yet. Add a record to see your health data.
                </Text>
              )}
            </>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {editing ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditing(false);
                // Reset form to current user data
                setForm({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                });
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.signOutButton]}
              onPress={signOut}
            >
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Sync Button */}
      <View style={styles.syncContainer}>
        <SyncButton />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  profilePicContainer: { alignItems: 'center', marginVertical: 20 },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primaryGreen,
  },
  editPicText: {
    color: Colors.primaryOrange,
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.lightGray,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryRed,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 16, color: Colors.darkGray, flex: 1 },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.darkGray,
    flex: 2,
    textAlign: 'right',
  },
  input: {
    flex: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryGreen,
    paddingVertical: 4,
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'right',
  },
  noDataText: {
    color: Colors.darkGray,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  editButton: { backgroundColor: Colors.primaryOrange },
  signOutButton: { backgroundColor: Colors.primaryRed },
  saveButton: { backgroundColor: Colors.primaryGreen },
  cancelButton: { backgroundColor: Colors.secondaryRed },
  buttonText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  syncContainer: { alignItems: 'center', marginBottom: 30 },
});

export default ProfileScreen;