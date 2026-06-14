import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Link } from 'expo-router';
import { useLogin } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const loginMutation = useLogin();

  const handleLogin = async () => {
    if (!email || !password) {
      setModal({ visible: true, type: 'error', title: 'Input Error', message: 'Please fill in all fields.' });
      return;
    }

    loginMutation.mutate({ email, password }, {
      onError: (error: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Login Failed',
          message: error.response?.data?.message || 'Invalid credentials. Please try again.'
        });
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
        <View className="pt-24 pb-12">
          <View className="w-16 h-16 bg-[#00E5FF] rounded-2xl items-center justify-center mb-8">
            <Ionicons name="shield-checkmark" size={32} color="black" />
          </View>
          <Text className="text-white text-4xl font-bold mb-2">Welcome Back</Text>
          <Text className="text-zinc-400 text-lg">Sign in to your account</Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Email Address</Text>
            <View className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 h-14 flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="#71717A" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor="#52525B"
                className="flex-1 h-full text-white ml-3"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View>
            <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Password</Text>
            <View className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 h-14 flex-row items-center">
              <Ionicons name="lock-closed-outline" size={20} color="#71717A" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#52525B"
                className="flex-1 h-full text-white ml-3"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#71717A" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity className="items-end">
            <Text className="text-[#00E5FF] font-medium">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            className={`bg-[#00E5FF] h-16 rounded-2xl items-center justify-center active:opacity-90 mt-4 ${loginMutation.isPending ? 'opacity-50' : ''}`}
          >
            <Text className="text-black font-bold text-xl">Sign In</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-auto pb-10">
          <Text className="text-zinc-500 text-base">Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-[#00E5FF] font-bold text-base">Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

      <StatusModal 
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, visible: false })} 
      />
    </KeyboardAvoidingView>
  );
}
