import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { authApi } from '../../src/api/auth.api';
import { StatusModal } from '../../src/components/StatusModal';

export default function ResetPassword() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  const router = useRouter();
  const { resetToken } = useLocalSearchParams<{ resetToken: string }>();

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Weak Password',
        message: 'Password must be at least 6 characters.'
      });
      return;
    }

    if (password !== confirmPassword) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Passwords Mismatch',
        message: 'The password values entered do not match.'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({ resetToken, password });
      setLoading(false);
      setModal({
        visible: true,
        type: 'success',
        title: 'Success',
        message: res.message || 'Your password was successfully reset.'
      });
    } catch (err: any) {
      setLoading(false);
      setModal({
        visible: true,
        type: 'error',
        title: 'Reset Failed',
        message: err.response?.data?.message || err.message || 'Could not reset password. Access token might be expired.'
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
            <Text className="text-foreground text-3xl font-extrabold mb-3">Choose New Password</Text>
            <Text className="text-muted-foreground text-base leading-6 mb-8">
              Choose a strong, unique password to secure your TrustPay merchant account.
            </Text>

            {/* Password input */}
            <View className="mb-6">
              <Text className="text-foreground text-sm font-semibold mb-2 pl-1">New Password</Text>
              <View className="bg-card border border-border rounded-2xl h-16 px-4 flex-row items-center shadow-xs">
                <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 h-full text-foreground ml-3 text-base"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password input */}
            <View className="mb-8">
              <Text className="text-foreground text-sm font-semibold mb-2 pl-1">Confirm New Password</Text>
              <View className="bg-card border border-border rounded-2xl h-16 px-4 flex-row items-center shadow-xs">
                <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your password"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 h-full text-foreground ml-3 text-base"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-2">
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity 
              onPress={handleReset}
              disabled={loading}
              className="bg-primary h-16 rounded-2xl items-center justify-center flex-row active:opacity-95 shadow-lg shadow-primary/30"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Update Password</Text>
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
            if (modal.type === 'success') {
              router.replace('/(auth)/login');
            }
          }} 
        />
      </SafeAreaView>
    </View>
  );
}
