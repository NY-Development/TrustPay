export const Storage = {
  async setItem(key: string, value: any) {
    try {
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Error saving data', e);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = localStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data', e);
      return null;
    }
  },

  async removeItem(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing data', e);
    }
  },
};

export const STORAGE_KEYS = {
  THEME_BUTTON_POSITION: 'theme_button_position',
  HAS_SEEN_ONBOARDING: 'has_seen_onboarding',
  BIOMETRICS_ENABLED: 'biometrics_enabled',
};
