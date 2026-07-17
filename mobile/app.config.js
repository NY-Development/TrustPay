import packageJson from './package.json';

export default {
  expo: {
    name: "TrustPay",
    slug: "TrustPay",
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
      googleServicesFile: "./google-services.json",
      usesCleartextTraffic: true,
    },
    web: {
      "bundler": "metro",
      // "single" (client-only SPA) avoids build-time static rendering, which
      // evaluates native-only modules (react-native-executorch) in Node and
      // crashes `eas update` web export. This app targets iOS/Android natively.
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-camera",
      "expo-asset",
      "expo-sharing",
      [
        "expo-build-properties",
        {
          "android": {
            "extraMavenRepos": [
              "https://www.jitpack.io",
              "https://oss.sonatype.org/content/repositories/snapshots/"
            ]
          }
        }
      ],
      [
      "react-native-audio-api",
      {
        "iosBackgroundMode": true,
        "iosMicrophonePermission": "This app requires access to the microphone to record audio.",
        "androidPermissions" : [
          "android.permission.MODIFY_AUDIO_SETTINGS",
          "android.permission.FOREGROUND_SERVICE",
          "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"
        ],
        "androidForegroundService": true,
        "androidFSTypes": [
          "mediaPlayback"
        ]
      }
    ],
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
      "expo-file-system",
      "expo-localization"
    ],
    experiments: {
      "typedRoutes": true
    },
    extra: {
      eas: {
        projectId: "a881255d-2e57-4c05-85f7-5d1e031fd71f"
      }
    },
    updates: {
      url: "https://u.expo.dev/a881255d-2e57-4c05-85f7-5d1e031fd71f"
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  }
};