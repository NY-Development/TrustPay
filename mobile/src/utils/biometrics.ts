import * as LocalAuthentication from 'expo-local-authentication';

export const BiometricService = {
  /**
   * Check if the device has biometric hardware available and if it's enrolled.
   */
  async checkAvailability() {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return { isAvailable, isEnrolled };
  },

  /**
   * Get the type of biometrics supported by the device.
   */
  async getSupportedTypes() {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  /**
   * Perform biometric authentication.
   */
  async authenticate(reason: string = 'Confirm your identity to continue') {
    const { isAvailable, isEnrolled } = await this.checkAvailability();

    if (!isAvailable || !isEnrolled) {
      throw new Error('Biometric authentication is not available or enrolled on this device.');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    return result.success;
  },
};
