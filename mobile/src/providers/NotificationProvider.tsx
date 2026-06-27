import React, { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated, updatePushToken } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isMounted) return;

    // Register for push notifications and save token
    registerForPushNotificationsAsync().then(token => {
      if (token && isMounted) {
        console.log('📲 [NotificationProvider] Expo Push Token:', token);
        // Save to backend via authStore
        if (user && token !== user.pushToken) {
          updatePushToken(token);
        }
      }
    });

    // Listener for notifications received while app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 [NotificationProvider] Foreground notification:', notification.request.content);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('👆 [NotificationProvider] Notification tapped:', data);

      if (data) {
        handleNotificationNavigation(router, data as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, isMounted, user]);

  return <>{children}</>;
};

/**
 * Handle navigation based on notification data type
 */
function handleNotificationNavigation(router: any, data: Record<string, any>) {
  const { type, id } = data;

  switch (type) {
    case 'VERIFICATION_RESULT':
      if (id) router.push(`/verification/${id}` as any);
      break;

    case 'SUBSCRIPTION_EXPIRING':
    case 'SUBSCRIPTION_EXPIRED':
      // Re-enter dashboard which will trigger subscription modal
      router.replace('/(tabs)');
      break;

    case 'PASSWORD_RESET':
      router.push('/(auth)/forgot-password' as any);
      break;

    case 'SYSTEM':
    default:
      router.replace('/(tabs)');
      break;
  }
}

/**
 * Register for push notifications and return the Expo push token
 */
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TrustPay',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#003ec7',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('❌ [NotificationProvider] Push notification permission not granted');
      return;
    }

    try {
      // @ts-ignore
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      if (!projectId) {
        console.warn('⚠️ [NotificationProvider] EAS projectId not found in app.config.js');
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;

      console.log('✅ [NotificationProvider] Push Token Retrieved:', token);
    } catch (e: any) {
      console.warn(
        '⚠️ [NotificationProvider] Failed to get push token (FCM credentials may not be compiled into the native build):',
        e.message || e
      );
    }
  } else {
    console.log('ℹ️ [NotificationProvider] Must use physical device for push notifications');
  }

  return token;
}
