import * as SplashScreen from 'expo-splash-screen';

class SplashControllerClass {
  private isHidden = false;
  private isLocked = false;

  /**
   * Prevent auto-hide on app start
   */
  async lock(): Promise<void> {
    if (this.isLocked) return;
    this.isLocked = true;

    try {
      await SplashScreen.preventAutoHideAsync();
    } catch (err) {
      console.log('[SplashController] lock error:', err);
    }
  }

  /**
   * Safe hide with retry + fallback protection
   */
  async hide(): Promise<void> {
    if (this.isHidden) return;
    this.isHidden = true;

    try {
      await SplashScreen.hideAsync();
    } catch (err) {
      console.log('[SplashController] hide error:', err);

      // Fallback retry (Expo sometimes throws transient errors)
      try {
        setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {});
        }, 300);
      } catch {}
    }
  }

  /**
   * Emergency force hide (use if app is stuck)
   */
  async forceHide(): Promise<void> {
    this.isHidden = true;

    try {
      await SplashScreen.hideAsync();
    } catch {
      // last resort: ignore
    }
  }

  /**
   * Reset (useful for dev reload scenarios)
   */
  reset() {
    this.isHidden = false;
    this.isLocked = false;
  }
}

export const SplashController = new SplashControllerClass();