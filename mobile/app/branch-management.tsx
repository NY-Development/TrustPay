import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBranches } from '@/src/hooks/useBranch';
import { useAuthStore } from '@/src/store/authStore';
import { Branch } from '@/src/types';

export default function BranchManagementScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const actorType = useAuthStore((s) => s.actorType);

  const { branches, isLoading, refetch } = useBranches();

  if (actorType !== 'owner') {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
        <Ionicons name="lock-closed-outline" size={48} color={isDark ? '#94a3b8' : '#64748b'} />
        <Text className="text-muted-foreground text-lg mt-4 text-center">Only owners can manage branches.</Text>
      </SafeAreaView>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/15',
    INACTIVE: 'bg-yellow-500/15',
    SUSPENDED: 'bg-red-500/15',
  };
  const statusTextColors: Record<string, string> = {
    ACTIVE: 'text-green-500',
    INACTIVE: 'text-yellow-500',
    SUSPENDED: 'text-red-500',
  };

  const renderItem = ({ item }: { item: Branch }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/branch-detail', params: { id: item._id } } as any)}
      className="bg-card border border-border rounded-2xl p-4 mb-3"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-foreground font-bold text-lg">{item.branchName}</Text>
          <Text className="text-primary text-sm font-mono">{item.branchCode}</Text>
          <Text className="text-muted-foreground text-sm mt-1">{[item.city, item.region].filter(Boolean).join(', ')}</Text>
          <View className="flex-row items-center mt-2">
            <View className={`px-3 py-1 rounded-full ${statusColors[item.status] || 'bg-muted'}`}>
              <Text className={`text-xs font-bold ${statusTextColors[item.status] || 'text-muted-foreground'}`}>{item.status}</Text>
            </View>
            {item.accounts?.length > 0 && (
              <Text className="text-muted-foreground text-xs ml-3">{item.accounts.length} account(s)</Text>
            )}
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
          <Text className="text-foreground text-xl font-bold">Branches</Text>
          <TouchableOpacity onPress={() => router.push('/branch-detail' as any)}>
            <Ionicons name="add-circle" size={28} color={isDark ? '#3b82f6' : '#003ec7'} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#003ec7'} />
        </View>
      ) : (
        <FlatList
          data={branches}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Ionicons name="business-outline" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text className="text-muted-foreground mt-4">No branches found</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
    </SafeAreaView>
  );
}
