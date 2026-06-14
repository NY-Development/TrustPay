import packageJson from './package.json';

export default {
  expo: {
    name: "TrustPay",
    slug: "TrustPay",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "TrustPay",
    userInterfaceStyle: "automatic",
    splash: {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.negyam.trustpay",
      buildNumber: packageJson.version
    },
    android: {
      adaptiveIcon: {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      package: "com.negyam.trustpay",
      versionCode: 1
    },
    web: {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store"
    ],
    experiments: {
      "typedRoutes": true
    },
    extra: {
      eas: {
        projectId: "a881255d-2e57-4c05-85f7-5d1e031fd71f"
      }
    }
  }
};
