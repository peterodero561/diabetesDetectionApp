import { HealthData } from '../types';

export const mockHealthData: HealthData[] = [
  { date: '2025-03-01', bmi: 22.5, glucose: 95 },
  { date: '2025-03-02', bmi: 22.3, glucose: 100 },
  { date: '2025-03-03', bmi: 22.8, glucose: 110 },
  { date: '2025-03-04', bmi: 22.6, glucose: 105 },
  { date: '2025-03-05', bmi: 22.4, glucose: 98 },
];

export const kenyanFoods = [
  { name: 'Ugali with Sukuma Wiki', description: 'Low glycemic index, high fiber' },
  { name: 'Grilled Fish with Kachumbari', description: 'Rich in omega-3, fresh vegetables' },
  { name: 'Brown Rice and Beans', description: 'Complex carbs, plant protein' },
  { name: 'Githeri (Maize & Beans)', description: 'Traditional, balanced meal' },
];

export const diabetesNews = [
  { title: 'New insulin delivery system approved', source: 'Kenya News', url: '#' },
  { title: 'Free diabetes screening in Nairobi', source: 'Health Kenya', url: '#' },
  { title: 'Diabetes awareness walk this weekend', source: 'Daily Nation', url: '#' },
];