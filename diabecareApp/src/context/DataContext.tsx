import React, { createContext, useState, useContext, useEffect } from 'react';
import { HealthData } from '../types';
import { loadHealthData, saveHealthData, loadPendingSync, savePendingSync } from '../utils/storage';

type DataContextType = {
  healthData: HealthData[];
  addHealthData: (entry: HealthData) => void;
  syncData: () => Promise<void>;
  pendingSync: any[];
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [pendingSync, setPendingSync] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const stored = await loadHealthData();
      setHealthData(stored);
      const pending = await loadPendingSync();
      setPendingSync(pending);
    };
    load();
  }, []);

  const addHealthData = async (entry: HealthData) => {
    const updated = [entry, ...healthData];
    setHealthData(updated);
    await saveHealthData(updated);
    // Simulate that data is not synced yet
    const newPending = [...pendingSync, entry];
    setPendingSync(newPending);
    await savePendingSync(newPending);
  };

  const syncData = async () => {
    // Simulate sending to server
    if (pendingSync.length > 0) {
      // In real app: send to API
      console.log('Syncing data:', pendingSync);
      // After successful sync, clear pending
      setPendingSync([]);
      await savePendingSync([]);
      alert('Data synced successfully!');
    } else {
      alert('No pending data to sync.');
    }
  };

  return (
    <DataContext.Provider value={{ healthData, addHealthData, syncData, pendingSync }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};