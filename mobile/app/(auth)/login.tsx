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
import { Storage, STORAGE_KEYS } from '@/src/utils/storage';
import {
  clearAuthCache,
  hydrateAuthCache,
} from '@/src/providers/query-auth-sync';

export default function Login() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loginMutation = useLogin();
  const { setUser, setBiometricsEnabled } = useAuthStore();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [biometricsPrompted, setBiometricsPrompted] = React.useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = React.useState(false);

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  // Check saved credentials and storage-level biometric authorization state
  React.useEffect(() => {
    const checkSaved = async () => {
      try {
        const savedEmail = await SecureStore.getItemAsync('savedEmail');
        const savedPassword = await SecureStore.getItemAsync('savedPassword');
        if (savedEmail && savedPassword) {
          setHasSavedCredentials(true);
        }
      } catch (err) {
        console.warn('Checking saved credentials failed:', err);
      }
    };
    checkSaved();
  }, []);

  const handleBiometricLoginPress = async () => {
    try {
      const { isAvailable, isEnrolled } = await BiometricService.checkAvailability();
      if (!isAvailable || !isEnrolled) {
        setModalState({
          visible: true,
          type: 'error',
          title: 'Not Supported',
          message: 'Biometric authorization is not configured or supported on this device.',
          onClose: () => setModalState((prev) => ({ ...prev, visible: false })),
        });
        return;
      }

      const savedEmail = await SecureStore.getItemAsync('savedEmail');
      const savedPassword = await SecureStore.getItemAsync('savedPassword');
      if (!savedEmail || !savedPassword) return;

      const result = await BiometricService.authenticate('Quick sign in to TrustPay');
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
            onError: (err: any) => {
              console.error('Biometric press login mutation failed:', err);
              setModalState({
                visible: true,
                type: 'error',
                title: 'Login Failed',
                message: err.response?.data?.message || 'Biometric login failed. Please sign in manually.',
                onClose: () => setModalState((prev) => ({ ...prev, visible: false })),
              });
            },
          }
        );
      }
    } catch (err: any) {
      console.warn('Biometric manual authentication failed:', err);
    }
  };

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
    
    // FIX: Read directly from persistent Storage to bypass hydration delays
    const bioEnabled = await Storage.getItem<boolean>(STORAGE_KEYS.BIOMETRICS_ENABLED);
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

        // FIX: Read from persistence here too to beat any hydrate() race condition
        const bioEnabled = await Storage.getItem<boolean>(STORAGE_KEYS.BIOMETRICS_ENABLED);
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
            await SecureStore.setItemAsync('savedEmail', email);
            await SecureStore.setItemAsync('savedPassword', password);

            await setUser(data.data.user, {
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            });

            clearAuthCache();
            await hydrateAuthCache();

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
              className="w-full h-16 bg-primary rounded-2xl items-center justify-center shadow-md active:opacity-90"
            >
              {loginMutation.isPending ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <Text className="text-primary-foreground font-bold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View className="items-center mt-8">
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

              {/* Dynamic biometric container below "Create an Account" link */}
              {hasSavedCredentials && (
                <View className="w-full items-center mt-6 pt-4 border-t border-border/40">
                  <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-4">
                    Or sign in with biometrics
                  </Text>
                  
                  <TouchableOpacity
                    onPress={handleBiometricLoginPress}
                    disabled={loginMutation.isPending}
                    activeOpacity={0.7}
                    style={{ backgroundColor: themePrimary + '15' }}
                    className="w-16 h-16 rounded-full items-center justify-center border border-primary/20 shadow-sm active:scale-95"
                  >
                    <Ionicons
                      name={Platform.OS === 'ios' ? 'face-id' : 'finger-print'}
                      size={32}
                      color={themePrimary}
                    />
                  </TouchableOpacity>
                </View>
              )}
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