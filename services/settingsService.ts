
interface Settings {
  title: string;
  logoUrl: string;
}

const SETTINGS_STORAGE_KEY = 'oliLabSettings';

export const loadSettings = (): Settings | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const serializedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (serializedSettings === null) {
            return null;
        }
        return JSON.parse(serializedSettings);
    } catch (error) {
        console.error("Could not load settings from local storage", error);
        return null;
    }
};

export const saveSettings = (settings: Settings): void => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const serializedSettings = JSON.stringify(settings);
        localStorage.setItem(SETTINGS_STORAGE_KEY, serializedSettings);
    } catch (error) {
        console.error("Could not save settings to local storage", error);
    }
};
