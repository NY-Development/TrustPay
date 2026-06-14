import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Link } from 'expo-router';
import { useRegister } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const registerMutation = useRegister();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setModal({ visible: true, type: 'error', title: 'Input Error', message: 'Please fill in all fields.' });
      return;
    }

    registerMutation.mutate({ name, email, password }, {
      onSuccess: () => {
        setModal({
          visible: true,
          type: 'success',
          title: 'Account Created',
          message: 'Your account has been created successfully. Welcome to TrustPay!',
        });
      },
      onError: (error: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Registration Failed',
          message: error.response?.data?.message || 'Something went wrong. Please try again.'
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
          <Text className="text-white text-4xl font-bold mb-2">Create Account</Text>
          <Text className="text-zinc-400 text-lg">Join TrustPay today</Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Full Name</Text>
            <View className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 h-14 flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#71717A" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor="#52525B"
                className="flex-1 h-full text-white ml-3"
              />
            </View>
          </View>

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
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleRegister}
            disabled={registerMutation.isPending}
            className={`bg-[#00E5FF] h-16 rounded-2xl items-center justify-center active:opacity-90 mt-4 ${registerMutation.isPending ? 'opacity-50' : ''}`}
          >
            <Text className="text-black font-bold text-xl">Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-auto pb-10">
          <Text className="text-zinc-500 text-base">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-[#00E5FF] font-bold text-base">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

      <StatusModal 
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => {
          setModal({ ...modal, visible: false });
          if (modal.type === 'success') router.replace('/(tabs)');
        }} 
      />
    </KeyboardAvoidingView>
  );
}
