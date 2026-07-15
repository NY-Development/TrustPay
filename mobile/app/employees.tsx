import React from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEmployees } from '@/src/hooks/useEmployee';
import { useAuthStore } from '@/src/store/authStore';
import { Employee } from '@/src/types';

export default function EmployeesScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const selectedBranch = useAuthStore((s) => s.selectedBranch);
  const actorType = useAuthStore((s) => s.actorType);

  const { employees, isLoading, refetch } = useEmployees(selectedBranch?._id);
  const [search, setSearch] = React.useState('');
  const [filterRole, setFilterRole] = React.useState<string | null>(null);

  const filteredEmployees = React.useMemo(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e: Employee) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    }
    if (filterRole) {
      result = result.filter((e: Employee) => e.role === filterRole);
    }
    return result;
  }, [employees, search, filterRole]);

  const roles = ['MANAGER', 'CASHIER', 'VERIFIER', 'RECEPTIONIST', 'OTHER'];

  if (actorType !== 'owner') {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
        <Ionicons name="lock-closed-outline" size={48} color={isDark ? '#94a3b8' : '#64748b'} />
        <Text className="text-muted-foreground text-lg mt-4 text-center">Only owners can manage employees.</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/employee-detail', params: { id: item._id } } as any)}
      className="bg-card border border-border rounded-2xl p-4 mb-3"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-foreground font-bold text-lg">{item.name}</Text>
          <Text className="text-muted-foreground text-sm">{item.email}</Text>
          <View className="flex-row items-center mt-2 space-x-2">
            <View className={`px-3 py-1 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
              <Text className={`text-xs font-bold ${item.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>{item.status}</Text>
            </View>
            <View className="bg-primary/10 px-3 py-1 rounded-full ml-2">
              <Text className="text-primary text-xs font-bold">{item.role}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">Employees</Text>
          <TouchableOpacity onPress={() => router.push('/invite-employee' as any)}>
            <Ionicons name="person-add" size={24} color={isDark ? '#3b82f6' : '#003ec7'} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="bg-muted border border-border rounded-2xl px-4 h-12 flex-row items-center mb-3">
          <Ionicons name="search" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            className="flex-1 ml-3 text-foreground"
            placeholder="Search employees..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Role Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...roles]}
          keyExtractor={(item) => item || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterRole(item)}
              className={`px-4 h-9 rounded-full items-center justify-center mr-2 border ${filterRole === item ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
            >
              <Text className={`text-xs font-bold ${filterRole === item ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {item || 'All'}
              </Text>
            </TouchableOpacity>
          )}
          className="mb-3"
        />

        {selectedBranch && (
          <Text className="text-muted-foreground text-xs mb-2">
            Branch: {selectedBranch.branchName} ({selectedBranch.branchCode})
          </Text>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#003ec7'} />
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Ionicons name="people-outline" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text className="text-muted-foreground mt-4">No employees found</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
    </SafeAreaView>
  );
}
