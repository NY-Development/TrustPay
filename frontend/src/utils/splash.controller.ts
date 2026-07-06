class SplashControllerClass {
  async lock(): Promise<void> {}
  async hide(): Promise<void> {}
  async forceHide(): Promise<void> {}
  reset() {}
}

export const SplashController = new SplashControllerClass();