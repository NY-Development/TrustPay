import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { authApi } from '@/src/api/auth.api';
import { StatusModal } from '@/src/components/StatusModal';

export default function VerifyOtp() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const [resetToken, setResetToken] = React.useState<string | null>(null);

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Invalid Code',
        message: 'Please enter the 6-digit verification code.'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email || '', otp.trim());
      setLoading(false);
      setResetToken(res.data?.resetToken || '');
      setModal({
        visible: true,
        type: 'success',
        title: 'Identity Verified',
        message: res.message || 'OTP verified successfully.'
      });
    } catch (err: any) {
      setLoading(false);
      setModal({
        visible: true,
        type: 'error',
        title: 'Verification Failed',
        message: err.response?.data?.message || err.message || 'Code matches failed or expired.'
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <View className="pt-8 px-6 flex-row items-center mb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-12 h-12 rounded-full bg-muted items-center justify-center active:opacity-85"
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1"
        >
          <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            <Text className="text-foreground text-3xl font-extrabold mb-3">Verification Code</Text>
            <Text className="text-muted-foreground text-base leading-6 mb-8">
              We've sent a 6-digit confirmation code code to <Text className="text-foreground font-semibold">{email}</Text>. Enter the code below to continue.
            </Text>

            {/* OTP code input */}
            <View className="mb-8">
              <Text className="text-foreground text-sm font-semibold mb-2 pl-1">6-Digit Code</Text>
              <View className="bg-card border border-border rounded-2xl h-16 px-4 flex-row items-center shadow-xs">
                <Ionicons name="keypad-outline" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="e.g. 123456"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 h-full text-foreground ml-3 text-lg font-black tracking-widest"
                />
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity 
              onPress={handleVerifyOtp}
              disabled={loading}
              className="bg-primary h-16 rounded-2xl items-center justify-center flex-row active:opacity-95 shadow-lg shadow-primary/30"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Verify Code</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <StatusModal 
          visible={modal.visible}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => {
            setModal({ ...modal, visible: false });
            if (modal.type === 'success' && resetToken) {
              router.replace({
                pathname: '/(auth)/reset-password',
                params: { resetToken }
              });
            }
          }} 
        />
      </SafeAreaView>
    </View>
  );
}
