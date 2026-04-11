export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  type: 'admin' | 'doctor' | 'patient';
  doctor_id?: number;
  created_at: string;
  doctor_name?: string;
}

export type HealthData = {
  date: string;
  bmi: number;
  glucose: number;
  systolic?: number;
  diastolic?: number;
};