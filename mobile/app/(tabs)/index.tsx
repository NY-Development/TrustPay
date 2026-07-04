import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { useNotifications } from '@/src/hooks/useNotifications';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  useNotifications();
  const { data: history, isLoading, refetch } = useVerificationHistory();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={isDark ? '#3b82f6' : '#003ec7'} />}
        >
          {/* Dashboard Header */}
          <View className="flex-row justify-between items-center py-8">
            <View>
              <Text className="text-muted-foreground text-lg font-medium">Verified Merchant</Text>
              <Text className="text-foreground text-3xl font-bold">TrustPay Dashboard</Text>
            </View>
            <TouchableOpacity className="w-12 h-12 bg-muted rounded-2xl items-center justify-center border border-border">
              <Ionicons name="notifications-outline" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
          </View>

          {/* Verification Card */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/verify' as any)}
            className="bg-primary rounded-[32px] p-8 mb-8 relative overflow-hidden shadow-2xl shadow-primary/40"
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.1)']}
              className="absolute inset-0"
            />
            <View className="flex-row justify-between items-start mb-6">
              <View className="bg-white/20 p-4 rounded-3xl">
                <Ionicons name="shield-checkmark" size={32} color="white" />
              </View>
              <View className="bg-white/10 px-4 py-2 rounded-full border border-white/20">
                <Text className="text-white font-bold text-xs">SECURE NODE</Text>
              </View>
            </View>
            
            <Text className="text-white text-3xl font-bold mb-2">Verify Payment</Text>
            <Text className="text-white/70 text-lg mb-8 leading-6">
              Start a new verification for Telebirr, CBE, or M-Pesa payments.
            </Text>

            <View className="bg-primary-foreground/20 h-16 rounded-2xl flex-row items-center justify-center">
              <Text className="text-white font-bold text-xl mr-2">New Verification</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </View>
          </TouchableOpacity>

          {/* Quick Stats */}
          <View className="flex-row gap-4 mb-8">
            <View className="flex-1 bg-card border border-border rounded-3xl p-6">
              <Text className="text-muted-foreground font-medium mb-1">Today</Text>
              <Text className="text-foreground text-2xl font-bold">
                {history?.data?.filter(v => new Date(v.createdAt).toDateString() === new Date().toDateString()).length || 0}
              </Text>
            </View>
            <View className="flex-1 bg-card border border-border rounded-3xl p-6">
              <Text className="text-primary font-medium mb-1">Total</Text>
              <Text className="text-foreground text-2xl font-bold">{history?.data?.length || 0}</Text>
            </View>
          </View>

          {/* Recent Section */}
          <View className="mb-12">
            <View className="flex-row justify-between items-center mb-6 px-2">
              <Text className="text-foreground text-xl font-bold">Recent Checks</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text className="text-primary font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            {history?.data && history.data.length > 0 ? (
              history.data.slice(0, 5).map((item: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => router.push(`/verification/${item._id || item.id}` as any)}
                  className="bg-card border border-border rounded-3xl p-6 mb-4 flex-row items-center active:opacity-80"
                >
                   <View className="w-12 h-12 bg-muted rounded-2xl items-center justify-center">
                      <Ionicons name="document-text-outline" size={24} color={isDark ? '#3b82f6' : '#003ec7'} />
                   </View>
                   <View className="ml-4 flex-1">
                      <Text className="text-foreground font-bold text-lg uppercase">{item.transactionId}</Text>
                      <Text className="text-muted-foreground text-sm">{item.provider} • {new Date(item.paymentDate).toLocaleDateString()}</Text>
                   </View>
                   <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-primary font-bold text-xs">{item.verified ? 'VERIFIED' : 'PENDING'}</Text>
                   </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-card border border-border rounded-3xl p-10 items-center justify-center">
                <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                  <Ionicons name="document-text-outline" size={28} color={isDark ? '#475569' : '#94a3b8'} />
                </View>
                <Text className="text-muted-foreground text-lg font-medium">No recent verifications</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
