import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { authApi } from '../../src/api/auth.api';
import { StatusModal } from '../../src/components/StatusModal';

export default function ForgotPassword() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim().toLowerCase());
      setLoading(false);
      setModal({
        visible: true,
        type: 'success',
        title: 'Code Sent',
        message: res.message || 'Verification code has been sent to your email.'
      });
    } catch (err: any) {
      setLoading(false);
      setModal({
        visible: true,
        type: 'error',
        title: 'Request Failed',
        message: err.response?.data?.message || err.message || 'Failed to dispatch verification code.'
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
            <Text className="text-foreground text-3xl font-extrabold mb-3">Reset Password</Text>
            <Text className="text-muted-foreground text-base leading-6 mb-8">
              Enter your email address below. We'll send you a 6-digit verification code to reset your account password.
            </Text>

            {/* Email input */}
            <View className="mb-8">
              <Text className="text-foreground text-sm font-semibold mb-2 pl-1">Email Address</Text>
              <View className="bg-card border border-border rounded-2xl h-16 px-4 flex-row items-center shadow-xs">
                <Ionicons name="mail-outline" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. name@merchant.com"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 h-full text-foreground ml-3 text-base"
                />
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity 
              onPress={handleSendOtp}
              disabled={loading}
              className="bg-primary h-16 rounded-2xl items-center justify-center flex-row active:opacity-95 shadow-lg shadow-primary/30"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Send Code</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <StatusModal 
          {...modal} 
          onClose={() => {
            setModal({ ...modal, visible: false });
            if (modal.type === 'success') {
              router.push({
                pathname: '/(auth)/verify-otp' as any,
                params: { email: email.trim().toLowerCase() }
              });
            }
          }} 
        />
      </SafeAreaView>
    </View>
  );
}
