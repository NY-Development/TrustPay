import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/src/store/authStore';
import { useUpdateProfile } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';

export default function EditProfileScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { user } = useAuthStore();
  const updateProfileMutation = useUpdateProfile();

  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');

  const [modal, setModal] = React.useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  const hasChanges = name !== user?.name || email !== user?.email;

  const handleSave = () => {
    if (!name.trim()) return;

    const payload: { name?: string; email?: string } = {};
    if (name !== user?.name) payload.name = name.trim();
    if (email !== user?.email) payload.email = email.trim();

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setModal({
          visible: true,
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully.',
        });
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Update Failed',
          message: err?.response?.data?.message || err.message || 'Something went wrong.',
        });
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          className="flex-1" 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View className="px-6 h-16 flex-row items-center border-b border-border justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
              >
                <Ionicons name="arrow-back" size={20} color={isDark ? 'white' : 'black'} />
              </TouchableOpacity>
              <Text className="text-foreground text-xl font-bold ml-4">Edit Profile</Text>
            </View>
          </View>

          <View className="flex-1 px-6 pt-8">
            {/* Avatar */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 rounded-3xl bg-primary items-center justify-center mb-3">
                <Text className="text-primary-foreground text-4xl font-bold">
                  {name ? name[0].toUpperCase() : 'U'}
                </Text>
              </View>
              <Text className="text-muted-foreground text-xs">
                {user?.role} Account
              </Text>
            </View>

            {/* Name Field */}
            <View className="mb-5">
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2 ml-1">
                Full Name
              </Text>
              <View className="bg-card border border-border rounded-2xl px-4 h-14 flex-row items-center">
                <Ionicons name="person-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  className="flex-1 text-foreground text-base ml-3"
                />
              </View>
            </View>

            {/* Email Field */}
            <View className="mb-8">
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2 ml-1">
                Email Address
              </Text>
              <View className="bg-card border border-border rounded-2xl px-4 h-14 flex-row items-center">
                <Ionicons name="mail-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 text-foreground text-base ml-3"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges || updateProfileMutation.isPending}
              className={`h-14 rounded-2xl items-center justify-center flex-row ${
                hasChanges ? 'bg-primary active:opacity-80' : 'bg-muted'
              }`}
            >
              {updateProfileMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={hasChanges ? 'white' : (isDark ? '#475569' : '#94a3b8')} />
                  <Text className={`font-bold text-base ml-2 ${hasChanges ? 'text-white' : 'text-muted-foreground'}`}>
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <StatusModal
        {...modal}
        onClose={() => {
          setModal((p) => ({ ...p, visible: false }));
          if (modal.type === 'success') router.back();
        }}
      />
    </View>
  );
}
