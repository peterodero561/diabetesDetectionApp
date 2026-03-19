import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import SyncButton from '../components/SyncButton';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen: React.FC = () => {
  const { user, updateUser, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    doctorName: user?.doctorName || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
    profilePic: user?.profilePic || '',
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setForm({ ...form, profilePic: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    await updateUser(form);
    setEditing(false);
    Alert.alert('Success', 'Profile updated');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Picture */}
      <View style={styles.profilePicContainer}>
        <TouchableOpacity onPress={pickImage} disabled={!editing}>
          <Image
            source={
              form.profilePic
                ? { uri: form.profilePic }
                : { uri: 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User' }
            }
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
            <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({...form, name: t})} />
          ) : (
            <Text style={styles.value}>{user?.name}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          {editing ? (
            <TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm({...form, email: t})} keyboardType="email-address" />
          ) : (
            <Text style={styles.value}>{user?.email}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Risk Level</Text>
          <Text style={[styles.value, { color: user?.riskLevel === 'high' ? Colors.primaryRed : user?.riskLevel === 'medium' ? Colors.primaryOrange : Colors.primaryGreen }]}>
            {user?.riskLevel?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Medical Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Latest BMI</Text>
          <Text style={styles.value}>{user?.latestBMI || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Latest Glucose</Text>
          <Text style={styles.value}>{user?.latestGlucose || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Doctor</Text>
          {editing ? (
            <TextInput style={styles.input} value={form.doctorName} onChangeText={(t) => setForm({...form, doctorName: t})} />
          ) : (
            <Text style={styles.value}>{user?.doctorName || 'Not set'}</Text>
          )}
        </View>
      </View>

      {/* Emergency Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name</Text>
          {editing ? (
            <TextInput style={styles.input} value={form.emergencyContactName} onChangeText={(t) => setForm({...form, emergencyContactName: t})} />
          ) : (
            <Text style={styles.value}>{user?.emergencyContactName || 'Not set'}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone</Text>
          {editing ? (
            <TextInput style={styles.input} value={form.emergencyContactPhone} onChangeText={(t) => setForm({...form, emergencyContactPhone: t})} keyboardType="phone-pad" />
          ) : (
            <Text style={styles.value}>{user?.emergencyContactPhone || 'Not set'}</Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {editing ? (
          <>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setEditing(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => setEditing(true)}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={signOut}>
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
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
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
  label: {
    fontSize: 16,
    color: Colors.darkGray,
    flex: 1,
  },
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
  editButton: {
    backgroundColor: Colors.primaryOrange,
  },
  signOutButton: {
    backgroundColor: Colors.primaryRed,
  },
  saveButton: {
    backgroundColor: Colors.primaryGreen,
  },
  cancelButton: {
    backgroundColor: Colors.secondaryRed,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  syncContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
});

export default ProfileScreen;