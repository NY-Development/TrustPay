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
import { TokenService } from '@/src/services/token.service';

import { useAuthStore } from '@/src/store/authStore';
import { Storage, STORAGE_KEYS } from '@/src/utils/storage';
import {
  clearAuthCache,
  hydrateAuthCache,
} from '@/src/providers/query-auth-sync';
import { useTranslation } from 'react-i18next'; // 👈 Import Translation

export default function Login() {
  const { t } = useTranslation(); // 👈 Initialize Translation
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loginMutation = useLogin();
  const { setUser, setBiometricsEnabled } = useAuthStore();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [biometricsPrompted, setBiometricsPrompted] = React.useState(false);
  const [hasSavedTokens, setHasSavedTokens] = React.useState(false);

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  React.useEffect(() => {
    const checkSavedTokens = async () => {
      try {
        const refreshToken = await TokenService.getRefreshToken();
        const bioEnabled = await Storage.getItem<boolean>(STORAGE_KEYS.BIOMETRICS_ENABLED);
        
        if (refreshToken && bioEnabled) {
          setHasSavedTokens(true);
        }
      } catch (err) {
        console.warn('Checking stored secure credentials engine failed:', err);
      }
    };
    checkSavedTokens();
  }, []);

  const handleBiometricLoginPress = async () => {
    try {
      const { isAvailable, isEnrolled } = await BiometricService.checkAvailability();
      if (!isAvailable || !isEnrolled) {
        setModalState({
          visible: true,
          type: 'error',
          title: t('login.bioNotSupportedTitle'),
          message: t('login.bioNotSupportedDesc'),
          onClose: () => setModalState((prev) => ({ ...prev, visible: false })),
        });
        return;
      }

      const refreshToken = await TokenService.getRefreshToken();
      if (!refreshToken) {
        setModalState({
          visible: true,
          type: 'error',
          title: t('login.sessionExpiredTitle'),
          message: t('login.sessionExpiredDesc'),
          onClose: () => setModalState((prev) => ({ ...prev, visible: false })),
        });
        return;
      }

      const result = await BiometricService.authenticate(t('login.bioPromptMsg'));
      if (result) {
        clearAuthCache();
        await hydrateAuthCache();
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.warn('Biometric interface extraction exception:', err);
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

  React.useEffect(() => {
    let active = true;
    const checkAndTriggerBiometrics = async () => {
      try {
        const hasToken = await TokenService.getAccessToken();
        if (hasToken) return;

        const bioEnabled = await Storage.getItem<boolean>(STORAGE_KEYS.BIOMETRICS_ENABLED);
        if (!bioEnabled) return;

        const { isAvailable, isEnrolled } = await BiometricService.checkAvailability();
        if (!isAvailable || !isEnrolled) return;

        const refreshToken = await TokenService.getRefreshToken();

        if (refreshToken && active && !biometricsPrompted) {
          setBiometricsPrompted(true);
          const result = await BiometricService.authenticate(t('login.bioPromptMsg'));
          if (result && active) {
            clearAuthCache();
            await hydrateAuthCache();
            router.replace('/(tabs)');
          } else {
            if (active) setBiometricsPrompted(false);
          }
        }
      } catch (err) {
        console.warn('Biometric background routine interception error:', err);
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
  }, [biometricsPrompted]);

  const handleLogin = async () => {
    if (!email || !password) {
      setModalState({
        visible: true,
        type: 'error',
        title: t('login.inputErrorTitle'),
        message: t('login.inputErrorDesc'),
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
            await setUser(data.data.user, {
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            });

            clearAuthCache();
            await hydrateAuthCache();

            const { isAvailable, isEnrolled } = await BiometricService.checkAvailability();

            setModalState({
              visible: true,
              type: 'success',
              title: t('login.successTitle'),
              message: isAvailable && isEnrolled 
                ? t('login.successBioMsg') 
                : t('login.successMsg'),
              onClose: async () => {
                setModalState((prev) => ({ ...prev, visible: false }));

                if (isAvailable && isEnrolled) {
                  try {
                    const confirmed = await BiometricService.authenticate(t('login.bioEnablePrompt'));
                    if (confirmed) {
                      await setBiometricsEnabled(true);
                      await Storage.setItem(STORAGE_KEYS.BIOMETRICS_ENABLED, true);
                    }
                  } catch (bioErr) {
                    console.warn('First-time biometric setup skipped or failed:', bioErr);
                  }
                }
                
                router.replace('/(tabs)');
              },
            });
          } catch (err) {
            console.error('Login cache loading mutation error:', err);
            router.replace('/(tabs)');
          }
        },
        onError: (error: any) => {
          setModalState({
            visible: true,
            type: 'error',
            title: t('login.failedTitle'),
            message:
              error.response?.data?.message || t('login.failedDesc'),
            onClose: () =>
              setModalState((prev) => ({ ...prev, visible: false })),
          });
        },
      }
    );
  };

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
            <View className="mb-12">
              <Text className="text-foreground text-3xl font-bold mb-4">
                {t('login.welcomeTitle')}
              </Text>
              <Text className="text-muted-foreground text-lg">
                {t('login.welcomeSubtitle')}
              </Text>
            </View>

            <View className="space-y-2 mb-6">
              <Text className="text-muted-foreground font-medium">{t('login.emailLabel')}</Text>
              <View className="flex-row items-center bg-muted border border-border rounded-2xl px-4 h-14">
                <Ionicons name="mail-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  className="flex-1 text-foreground ml-3 h-full"
                  placeholder="abebe@gmail.com"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="space-y-2 mb-2">
              <Text className="text-muted-foreground font-medium">{t('login.passLabel')}</Text>
              <View className="flex-row items-center bg-muted border border-border rounded-2xl px-4 h-14">
                <Ionicons
                  name={showPassword ? 'lock-open-outline' : 'lock-closed-outline'}
                  size={20}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
                <TextInput
                  className="flex-1 text-foreground ml-3 h-full"
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password' as any)}
              className="items-end mb-6"
            >
              <Text className="text-primary font-medium">{t('login.forgotPass')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full h-16 bg-primary rounded-2xl items-center justify-center shadow-md active:opacity-90"
            >
              {loginMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-primary-foreground font-bold text-lg">{t('login.btnSignIn')}</Text>
              )}
            </TouchableOpacity>

            <View className="items-center mt-8">
              <Text className="text-muted-foreground">{t('login.noAccount')}</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity className="mt-2">
                  <Text className="text-primary font-bold text-lg">{t('login.btnRegister')}</Text>
                </TouchableOpacity>
              </Link>

              {hasSavedTokens && (
                <View className="w-full items-center mt-6 pt-4 border-t border-border/40">
                  <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-4">
                    {t('login.bioOrLabel')}
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