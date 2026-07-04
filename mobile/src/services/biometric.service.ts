import { BiometricService } from "@/src/utils/biometrics";

export class AppBiometricService {
  static async authenticate() {
    return BiometricService.authenticate(
      "Unlock TrustPay"
    );
  }

  static async checkAvailability() {
    return BiometricService.checkAvailability();
  }
}