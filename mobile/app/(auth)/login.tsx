import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useLogin } from '@/src/hooks/useAuth';
import { StatusModal, StatusModalProps } from '@/src/components/StatusModal';
import { BiometricService } from '@/src/utils/biometrics';
import * as SecureStore from 'expo-secure-store';
import { TokenService } from '@/src/services/token.service';

import { useAuthStore } from '@/src/store/authStore';
import {
  clearAuthCache,
  hydrateAuthCache,
} from '@/src/providers/query-auth-sync';

export default function Login() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loginMutation = useLogin();
  const { setUser, setBiometricsEnabled, biometricsEnabled } = useAuthStore();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [biometricsPrompted, setBiometricsPrompted] = React.useState(false);

  const [modalState, setModalState] = React.useState<StatusModalProps>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onClose: () =>
      setModalState((prev) => ({ ...prev, visible: false })),
  });

  /* =========================================================
     BIOMETRIC AUTO & INPUT TRIGGER
  ========================================================= */
  const triggerBiometricsIfEnabled = async () => {
    if (biometricsPrompted) return;
    const bioEnabled = useAuthStore.getState().biometricsEnabled;
    if (!bioEnabled) return;

    try {
      const savedEmail = await SecureStore.getItemAsync('savedEmail');
      const savedPassword = await SecureStore.getItemAsync('savedPassword');
      if (!savedEmail || !savedPassword) return;

      setBiometricsPrompted(true);
      const result = await BiometricService.authenticate('Sign in to TrustPay');
      if (result) {
        setEmail(savedEmail);
        setPassword(savedPassword);

        loginMutation.mutate(
          { email: savedEmail, password: savedPassword },
          {
            onSuccess: async (data: any) => {
              await setUser(data.data.user, {
                accessToken: data.data.accessToken,
                refreshToken: data.data.refreshToken,
              });
              clearAuthCache();
              await hydrateAuthCache();
              router.replace('/(tabs)');
            },
            onError: (err) => {
              console.error('Biometric authentication login failed:', err);
              setBiometricsPrompted(false);
            },
          }
        );
      } else {
        setBiometricsPrompted(false);
      }
    } catch (err) {
      console.warn('Biometric input trigger failed:', err);
      setBiometricsPrompted(false);
    }
  };

  React.useEffect(() => {
    let active = true;
    const checkAndTriggerBiometrics = async () => {
      try {
        const hasToken = await TokenService.getAccessToken();
        if (hasToken) return;

        const bioEnabled = useAuthStore.getState().biometricsEnabled;
        if (!bioEnabled) return;

        const { isAvailable, isEnrolled } = await BiometricService.checkAvailability();
        if (!isAvailable || !isEnrolled) return;

        const savedEmail = await SecureStore.getItemAsync('savedEmail');
        const savedPassword = await SecureStore.getItemAsync('savedPassword');

        if (savedEmail && savedPassword && active) {
          setBiometricsPrompted(true);
          const result = await BiometricService.authenticate('Sign in to TrustPay');
          if (result && active) {
            loginMutation.mutate(
              { email: savedEmail, password: savedPassword },
              {
                onSuccess: async (data: any) => {
                  if (!active) return;
                  await setUser(data.data.user, {
                    accessToken: data.data.accessToken,
                    refreshToken: data.data.refreshToken,
                  });
                  clearAuthCache();
                  await hydrateAuthCache();
                  router.replace('/(tabs)');
                },
                onError: (err) => {
                  console.error('Biometric auto-login failed:', err);
                  if (active) setBiometricsPrompted(false);
                },
              }
            );
          } else {
            if (active) setBiometricsPrompted(false);
          }
        }
      } catch (err) {
        console.warn('Biometric auto-challenge failed:', err);
        if (active) setBiometricsPrompted(false);
      }
    };

    const timer = setTimeout(() => {
      checkAndTriggerBiometrics();
    }, 600);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  /* =========================================================
     BIOMETRIC GATE
  ========================================================= */
  const handleBiometricGate = async () => {
    const { isAvailable, isEnrolled } =
      await BiometricService.checkAvailability();

    if (isAvailable && isEnrolled) {
      await setBiometricsEnabled(true);
    }

    router.replace('/(tabs)');
  };

  /* =========================================================
     LOGIN HANDLER
  ========================================================= */
  const handleLogin = async () => {
    if (!email || !password) {
      setModalState({
        visible: true,
        type: 'error',
        title: 'Input Error',
        message: 'Please fill in all fields.',
        onClose: () =>
          setModalState((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: async (data: any) => {
          try {
            /**
             * Save credentials to SecureStore for future biometrics
             */
            await SecureStore.setItemAsync('savedEmail', email);
            await SecureStore.setItemAsync('savedPassword', password);

            /**
             * 1. Store user + tokens
             */
            await setUser(data.data.user, {
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            });

            /**
             * 2. Clear stale cache immediately
             */
            clearAuthCache();

            /**
             * 3. Warm up essential queries (optional but stable UI)
             */
            await hydrateAuthCache();

            /**
             * 4. Show success modal
             */
            setModalState({
              visible: true,
              type: 'success',
              title: 'Login Successful',
              message: 'Welcome back to TrustPay!',
              onClose: async () => {
                setModalState((prev) => ({
                  ...prev,
                  visible: false,
                }));

                /**
                 * 5. IMPORTANT: biometric gate AFTER login
                 * ensures smooth UX + avoids race conditions
                 */
                await handleBiometricGate();
              },
            });
          } catch (err) {
            console.error('Login post-processing failed:', err);
          }
        },

        onError: (error: any) => {
          setModalState({
            visible: true,
            type: 'error',
            title: 'Login Failed',
            message:
              error.response?.data?.message ||
              'Invalid credentials. Please try again.',
            onClose: () =>
              setModalState((prev) => ({ ...prev, visible: false })),
          });
        },
      }
    );
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            {/* HEADER */}
            <View className="mb-12">
              <Text className="text-foreground text-3xl font-bold mb-4">
                Welcome Back
              </Text>

              <Text className="text-muted-foreground text-lg">
                Enter your credentials to access your merchant dashboard.
              </Text>
            </View>

            {/* EMAIL */}
            <View className="space-y-2 mb-6">
              <Text className="text-muted-foreground font-medium">
                Email Address
              </Text>

              <View className="flex-row items-center bg-muted border border-border rounded-2xl px-4 h-14">
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />

                <TextInput
                  className="flex-1 text-foreground ml-3 h-full"
                  placeholder="abebe@gmail.com"
                  placeholderTextColor={
                    isDark ? '#64748b' : '#94a3b8'
                  }
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  onFocus={triggerBiometricsIfEnabled}
                  onTouchStart={triggerBiometricsIfEnabled}
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View className="space-y-2 mb-2">
              <Text className="text-muted-foreground font-medium">
                Password
              </Text>

              <View className="flex-row items-center bg-muted border border-border rounded-2xl px-4 h-14">
                <Ionicons
                  name={
                    showPassword
                      ? 'lock-open-outline'
                      : 'lock-closed-outline'
                  }
                  size={20}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />

                <TextInput
                  className="flex-1 text-foreground ml-3 h-full"
                  placeholder="••••••••"
                  placeholderTextColor={
                    isDark ? '#64748b' : '#94a3b8'
                  }
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={triggerBiometricsIfEnabled}
                  onTouchStart={triggerBiometricsIfEnabled}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? '#94a3b8' : '#64748b'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* FORGOT PASSWORD */}
            <TouchableOpacity
              onPress={() =>
                router.push('/(auth)/forgot-password' as any)
              }
              className="items-end mb-6"
            >
              <Text className="text-primary font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full h-16 bg-primary rounded-2xl items-center justify-center"
            >
              {loginMutation.isPending ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#000' : '#fff'}
                />
              ) : (
                <Text className="text-primary-foreground font-bold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View className="items-center mt-10">
              <Text className="text-muted-foreground">
                Don't have an account?
              </Text>

              <Link href="/(auth)/register" asChild>
                <TouchableOpacity className="mt-2">
                  <Text className="text-primary font-bold text-lg">
                    Create an Account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* MODAL */}
        <StatusModal
          visible={modalState.visible}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          onClose={modalState.onClose}
        />
      </SafeAreaView>
    </View>
  );
}