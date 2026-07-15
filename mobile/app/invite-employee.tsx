import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEmployees } from '@/src/hooks/useEmployee';
import { useAuthStore } from '@/src/store/authStore';
import { StatusModal } from '@/src/components/StatusModal';

export default function InviteEmployeeScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  
  const branches = useAuthStore((s) => s.branches);
  const selectedBranch = useAuthStore((s) => s.selectedBranch);
  const { createEmployee, isCreating } = useEmployees();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('CASHIER');
  const [branchId, setBranchId] = React.useState(selectedBranch?._id || '');
  const [showPassword, setShowPassword] = React.useState(false);

  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const handleInvite = async () => {
    if (!name || !email || !password || !branchId) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Input Error',
        message: 'All fields are required.',
      });
      return;
    }

    try {
      await createEmployee({ name, email, password, role, branchId });
      setModal({
        visible: true,
        type: 'success',
        title: 'Success',
        message: 'Employee has been invited successfully.',
      });
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Invitation Failed',
        message: err.response?.data?.message || 'Something went wrong.',
      });
    }
  };

  const roles = ['MANAGER', 'CASHIER', 'VERIFIER', 'RECEPTIONIST', 'OTHER'];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-grow px-6 py-4">
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>
            <Text className="text-foreground text-xl font-bold">Invite Employee</Text>
            <View style={{ width: 24 }} />
          </View>

          <View className="space-y-4">
            <View className="mb-4">
              <Text className="text-muted-foreground font-medium mb-2">Full Name</Text>
              <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
                <Ionicons name="person-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-foreground"
                  placeholder="Employee name"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-muted-foreground font-medium mb-2">Email Address</Text>
              <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
                <Ionicons name="mail-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-foreground"
                  placeholder="employee@business.com"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-muted-foreground font-medium mb-2">Initial Password</Text>
              <View className="bg-muted border border-border rounded-2xl h-14 px-4 flex-row items-center">
                <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-foreground"
                  placeholder="Min 6 characters"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Target Branch */}
            <View className="mb-4">
              <Text className="text-muted-foreground font-medium mb-2">Assign to Branch</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                {branches.map((b) => (
                  <TouchableOpacity
                    key={b._id}
                    onPress={() => setBranchId(b._id)}
                    className={`px-4 h-12 rounded-2xl items-center justify-center border mr-2 ${branchId === b._id ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                  >
                    <Text className={`font-semibold text-sm ${branchId === b._id ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                      {b.branchName} ({b.branchCode})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Role selection */}
            <View className="mb-6">
              <Text className="text-muted-foreground font-medium mb-2">Select Staff Role</Text>
              <View className="flex-row flex-wrap">
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    className={`px-4 h-10 rounded-full items-center justify-center border mr-2 mb-2 ${role === r ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
                  >
                    <Text className={`text-xs font-bold ${role === r ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleInvite}
              disabled={isCreating}
              className="bg-primary h-16 rounded-2xl items-center justify-center shadow-lg active:opacity-90 mt-4"
            >
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-bold text-lg">Send Invitation</Text>
              )}
            </TouchableOpacity>
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
          if (modal.type === 'success') router.back();
        }}
      />
    </SafeAreaView>
  );
}
