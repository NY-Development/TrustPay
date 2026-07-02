import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useLogin } from '@/src/hooks/useAuth';
import { StatusModal, StatusModalProps } from '@/src/components/StatusModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BiometricService } from '@/src/utils/biometrics';
import { useAuthStore } from '@/src/store/authStore';

export default function Login() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [modalState, setModalState] = React.useState<StatusModalProps>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onClose: () => setModalState(prev => ({ ...prev, visible: false }))
  });

  const loginMutation = useLogin();
  const { setBiometricsEnabled } = useAuthStore();

  const promptBiometrics = async () => {
    const { isAvailable, isEnrolled } = await BiometricService.checkAvailability();
    if (isAvailable && isEnrolled) {
      await setBiometricsEnabled(true);
      router.replace('/(tabs)');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setModalState({ ...modalState, visible: true, type: 'error', title: 'Input Error', message: 'Please fill in all fields.' });
      return;
    }

    loginMutation.mutate({ email, password }, {
      onSuccess: () => {
        setModalState({
          visible: true,
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome back to TrustPay!',
          onClose: () => {
            setModalState(prev => ({ ...prev, visible: false }));
            promptBiometrics();
          }
        });
      },
      onError: (error: any) => {
        setModalState({
          ...modalState,
          visible: true,
          type: 'error',
          title: 'Login Failed',
          message: error.response?.data?.message || 'Invalid credentials. Please try again.'
        });
      }
    });
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
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <View className="mb-12">
              <Text className="text-foreground text-3xl font-bold mb-4">Welcome Back</Text>
              <Text className="text-muted-foreground text-lg">Enter your credentials to access your merchant dashboard.</Text>
            </View>

            {/* Form */}
            <View className="space-y-6">
              <View className="space-y-2">
                <Text className="text-muted-foreground font-medium">Email Address</Text>
                <View className="flex-row items-center bg-muted border border-border rounded-2xl px-4 h-14 focus-within:border-primary focus-within:bg-muted/50 transition-all">
                  <Ionicons name="mail-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    className="flex-1 text-foreground ml-3 h-full"
                    placeholder="abebe@gmail.com"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="space-y-2">
                <Text className="text-muted-foreground font-medium">Password</Text>
                <View className="flex-row items-center bg-muted border border-border rounded-2xl px-4 h-14 focus-within:border-primary focus-within:bg-muted/50 transition-all">
                  <Ionicons name={showPassword ? "lock-open-outline" : "lock-closed-outline"} size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  <TextInput
                    className="flex-1 text-foreground ml-3 h-full"
                    placeholder="••••••••"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => router.push('/(auth)/forgot-password' as any)}
                className="items-end p-4"
              >
                <Text className="text-primary font-medium">Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loginMutation.isPending}
                className="w-full h-16 bg-primary rounded-2xl items-center justify-center shadow-lg active:opacity-90"
              >
                {/* <LinearGradient
                  colors={isDark ? ['#1e3a8a', '#3b82f6'] : ['#003ec7', '#00E5FF']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  className="w-full h-full rounded-full items-center justify-center"
                > */}
                  {loginMutation.isPending ? (
                    <ActivityIndicator size="large" color={isDark ? '#000' : '#fff'} />
                  ) : (
                    <Text className="text-primary-foreground font-bold text-lg">Sign In</Text>
                  )}
                {/* </LinearGradient> */}
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View className="items-center mt-12">
              <Text className="text-muted-foreground">Don't have an account?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity className="mt-2">
                  <Text className="text-primary font-bold text-lg">Create an Account</Text>
                </TouchableOpacity>
              </Link>
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
