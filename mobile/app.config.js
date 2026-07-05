import packageJson from './package.json';

export default {
  expo: {
    name: "TrustPay",
    slug: "trust-pay",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "trustpay",
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
      buildNumber: packageJson.version,
      deploymentTarget: "15.0"
    },
    android: {
      adaptiveIcon: {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      package: "com.negyam.trustpay",
      versionCode: 1,
      minSdkVersion: 26,
      googleServicesFile: "./google-services.json"
    },
    web: {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-camera",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#004ac6"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow TrustPay Mobile to access your camera to scan invoices, receipts, and documents."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow TrustPay Mobile to access your photo library to select and upload stored receipt images."
        }
      ],
      "expo-font",
      "expo-local-authentication",
      "expo-file-system"
    ],
    experiments: {
      "typedRoutes": true
    },
    extra: {
      eas: {
        projectId: "dfda12ef-52b6-4549-8d2a-0496c2dafb92"
      }
    },
    updates: {
      url: "https://u.expo.dev/dfda12ef-52b6-4549-8d2a-0496c2dafb92"
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  }
};
