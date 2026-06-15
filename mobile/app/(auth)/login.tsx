import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useLogin } from '@/src/hooks/useAuth';
import { StatusModal, StatusModalProps } from '@/src/components/StatusModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BiometricService } from '@/src/utils/biometrics';
import { useAuthStore } from '@/src/store/authStore';

export default function Login() {
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
      Alert.alert(
        'Enable Biometrics',
        'Would you like to enable biometric login for future sessions?',
        [
          { text: 'No', style: 'cancel', onPress: () => router.replace('/(tabs)') },
          { 
            text: 'Yes', 
            onPress: async () => {
              await setBiometricsEnabled(true);
              router.replace('/(tabs)');
            } 
          }
        ]
      );
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
    <View className="flex-1 bg-black">
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
              <Text className="text-white text-3xl font-bold mb-4">Welcome Back</Text>
              <Text className="text-zinc-500 text-lg">Enter your credentials to access your merchant dashboard.</Text>
            </View>

            {/* Form */}
            <View className="space-y-6">
              <View className="space-y-2">
                <Text className="text-zinc-400 font-medium">Email Address</Text>
                <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 h-14 focus-within:border-[#00E5FF] focus-within:bg-zinc-800/50 transition-all">
                  <Ionicons name="mail-outline" size={20} color="#52525B" />
                  <TextInput
                    className="flex-1 text-white ml-3 h-full"
                    placeholder="[EMAIL_ADDRESS]"
                    placeholderTextColor="#52525B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="space-y-2">
                <Text className="text-zinc-400 font-medium">Password</Text>
                <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 h-14 focus-within:border-[#00E5FF] focus-within:bg-zinc-800/50 transition-all">
                  <Ionicons name={showPassword ? "lock-open-outline" : "lock-closed-outline"} size={20} color="#52525B" />
                  <TextInput
                    className="flex-1 text-white ml-3 h-full"
                    placeholder="••••••••"
                    placeholderTextColor="#52525B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#52525B" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity className="items-end">
                <Text className="text-[#00E5FF] font-medium">Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loginMutation.isPending}
                className="w-full h-16 bg-[#003ec7] rounded-2xl items-center justify-center shadow-lg active:opacity-90"
              >
                <LinearGradient
                  colors={['#003ec7', '#00E5FF']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  className="w-full h-full rounded-2xl items-center justify-center"
                >
                  {loginMutation.isPending ? (
                    <ActivityIndicator size="large" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-lg">Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View className="items-center mt-12">
              <Text className="text-zinc-500">Don't have an account?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity className="mt-2">
                  <Text className="text-[#00E5FF] font-bold text-lg">Create an Account</Text>
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
