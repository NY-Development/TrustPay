/** Biometrics stub — not available on web */
export const BiometricService = {
  async checkAvailability() {
    return { isAvailable: false, isEnrolled: false };
  },

  async getSupportedTypes() {
    return [];
  },

  async authenticate(_reason?: string) {
    return false;
  },
};
