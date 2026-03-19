export type User = {
  id: string;
  email: string;
  name: string;
  profilePic?: string; // uri
  riskLevel: 'high' | 'medium' | 'low';
  // medical
  latestBMI?: number;
  latestGlucose?: number;
  latestBP?: string;
  doctorName?: string;
  // emergency
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

export type HealthData = {
  date: string;
  bmi: number;
  glucose: number;
  systolic?: number;
  diastolic?: number;
};