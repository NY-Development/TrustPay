import React from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useRegister } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
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
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
        >
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-[#00E5FF]/10 rounded-2xl items-center justify-center mb-6 border border-[#00E5FF]/20">
              <Ionicons name="person-add-outline" size={32} color="#00E5FF" />
            </View>
            <Text className="text-white text-3xl font-bold mb-2">Create Account</Text>
            <Text className="text-zinc-500 text-lg">Join the TrustPay network</Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Full Name</Text>
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl h-14 px-4 flex-row items-center focus:border-[#00E5FF]">
                <Ionicons name="person-outline" size={18} color="#52525B" />
                <TextInput
                  className="flex-1 ml-3 text-white text-lg"
                  placeholder="Enter your name"
                  placeholderTextColor="#52525B"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View>
              <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1 mt-4">Email Address</Text>
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl h-14 px-4 flex-row items-center focus:border-[#00E5FF]">
                <Ionicons name="mail-outline" size={18} color="#52525B" />
                <TextInput
                  className="flex-1 ml-3 text-white text-lg"
                  placeholder="name@business.com"
                  placeholderTextColor="#52525B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View>
              <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1 mt-4">Password</Text>
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl h-14 px-4 flex-row items-center focus:border-[#00E5FF]">
                <Ionicons name="lock-closed-outline" size={18} color="#52525B" />
                <TextInput
                  className="flex-1 ml-3 text-white text-lg"
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#52525B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={18} 
                    color="#52525B" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleRegister}
              disabled={registerMutation.isPending}
              className="bg-[#00E5FF] h-16 rounded-2xl items-center justify-center mt-8 active:opacity-90 shadow-lg shadow-[#00E5FF]/20"
            >
              <Text className="text-black font-bold text-xl">Get Started</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-10">
            <Text className="text-zinc-500 text-base">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-[#00E5FF] font-bold text-base">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}
