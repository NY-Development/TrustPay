import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useUpdateProfile } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';

export default function CompanyProfileScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  
  const user = useAuthStore((s) => s.user);
  const actorType = useAuthStore((s) => s.actorType);
  const updateProfileMutation = useUpdateProfile();

  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and Email are required.');
      return;
    }

    updateProfileMutation.mutate(
      { name: name.trim(), email: email.trim() },
      {
        onSuccess: () => {
          setModal({
            visible: true,
            type: 'success',
            title: 'Profile Updated',
            message: 'Your profile has been saved successfully.',
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: 'Save Failed',
            message: err.response?.data?.message || 'Could not update profile fields.',
          });
        },
      }
    );
  };

  const company = user?.companyInfo;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-grow px-6 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">Profile & Business Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* User Card */}
        <View className="bg-card border border-border rounded-3xl p-6 mb-6">
          <Text className="text-foreground font-bold text-lg mb-4">Personal Details</Text>
          
          <View className="mb-4">
            <Text className="text-muted-foreground text-xs font-semibold mb-2">Registered Owner Name</Text>
            <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
              <Ionicons name="person-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                className="flex-1 ml-3 text-foreground"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-muted-foreground text-xs font-semibold mb-2">Account Email</Text>
            <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
              <Ionicons name="mail-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 ml-3 text-foreground"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={updateProfileMutation.isPending}
            className="w-full h-14 bg-primary rounded-2xl items-center justify-center shadow-md active:opacity-90 mt-2"
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-bold text-base">Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Organization Card */}
        {actorType === 'owner' && company && (
          <View className="bg-card border border-border rounded-3xl p-6 mb-12">
            <Text className="text-foreground font-bold text-lg mb-4">Organization Profile</Text>
            
            <View className="flex-row justify-between items-center py-3 border-b border-border/40">
              <Text className="text-muted-foreground font-medium text-sm">Company Name</Text>
              <Text className="text-foreground font-bold text-sm">{company.companyName}</Text>
            </View>
            
            <View className="flex-row justify-between items-center py-3 border-b border-border/40">
              <Text className="text-muted-foreground font-medium text-sm">Business Type</Text>
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-primary font-bold text-xs">{company.companyType}</Text>
              </View>
            </View>
            
            {company.website ? (
              <View className="flex-row justify-between items-center py-3 border-b border-border/40">
                <Text className="text-muted-foreground font-medium text-sm">Website</Text>
                <Text className="text-foreground font-semibold text-sm">{company.website}</Text>
              </View>
            ) : null}

            <View className="flex-row justify-between items-center py-3">
              <Text className="text-muted-foreground font-medium text-sm">Headquarters</Text>
              <Text className="text-foreground font-semibold text-sm">
                {[company.city, company.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <StatusModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, visible: false })}
      />
    </SafeAreaView>
  );
}
