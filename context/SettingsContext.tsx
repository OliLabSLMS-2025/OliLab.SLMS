import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { loadSettings, saveSettings } from '../services/settingsService';

interface Settings {
  title: string;
  logoUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  title: 'OliLab',
  logoUrl: '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // FIX: Initialize with default settings to prevent SSR errors.
  // Settings from localStorage will be loaded client-side in a useEffect.
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage only on the client-side after the component mounts.
  useEffect(() => {
    const storedSettings = loadSettings();
    if (storedSettings) {
      setSettings(storedSettings);
    }
  }, []);


  // Save settings to localStorage whenever they change.
  useEffect(() => {
    // This check prevents writing the default settings to localStorage on the initial render
    // before they have been loaded from storage.
    if (JSON.stringify(settings) !== JSON.stringify(defaultSettings)) {
        saveSettings(settings);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
