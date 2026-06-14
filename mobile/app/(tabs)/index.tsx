import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: history, isLoading, refetch } = useVerificationHistory();
  const router = useRouter();

  const stats = [
    { label: 'Verified', value: history?.data?.filter(v => v.verified).length || 0, icon: 'checkmark-circle-outline', color: '#00E5FF' },
    { label: 'Pending', value: 0, icon: 'time-outline', color: '#FFD700' },
    { label: 'Flagged', value: history?.data?.filter(v => !v.verified).length || 0, icon: 'alert-circle-outline', color: '#FF3D00' },
  ];

  return (
    <View className="flex-1 bg-black">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00E5FF" />}
      >
        {/* Header */}
        <LinearGradient
          colors={['#12005E', 'black']}
          className="pt-20 px-6 pb-12 rounded-b-[40px]"
        >
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-zinc-500 text-lg font-medium">Welcome back,</Text>
              <Text className="text-white text-3xl font-bold">{user?.name || 'Partner'}</Text>
            </View>
            <TouchableOpacity className="w-12 h-12 rounded-full bg-white/10 items-center justify-center border border-white/10">
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-row justify-between">
            {stats.map((stat, i) => (
              <View key={i} className="bg-white/5 border border-white/10 rounded-3xl p-4 w-[31%] items-center">
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                <Text className="text-white text-xl font-bold mt-2">{stat.value}</Text>
                <Text className="text-zinc-500 text-xs mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View className="px-6 -mt-8">
          {/* Main Action Card */}
          <LinearGradient
            colors={['#00E5FF', '#12005E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-8 shadow-2xl shadow-[#00E5FF]/20"
          >
            <Text className="text-black text-2xl font-bold mb-2">Verify New Payment</Text>
            <Text className="text-white/80 text-base mb-6">Scan QR, take a screenshot, or enter reference manually.</Text>
            <TouchableOpacity 
              className="bg-white h-14 rounded-2xl items-center justify-center flex-row"
              onPress={() => router.push('/(tabs)/verify')}
            >
              <Ionicons name="scan" size={24} color="#12005E" />
              <Text className="text-[#12005E] font-bold text-lg ml-2">Start Scanning</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Recent Activity */}
          <View className="mt-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold">Recent History</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text className="text-[#00E5FF] font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            {history?.data?.slice(0, 5).map((item, i) => (
              <View key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-4 flex-row items-center">
                <View className="w-12 h-12 rounded-xl bg-zinc-800 items-center justify-center">
                  <Ionicons 
                    name={item.provider === 'telebirr' ? 'phone-portrait' : 'business'} 
                    size={24} 
                    color="#00E5FF" 
                  />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-white font-bold text-base uppercase">{item.transactionId}</Text>
                  <Text className="text-zinc-500 text-sm">{item.provider} • {format(new Date(item.paymentDate), 'MMM dd, HH:mm')}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[#00E5FF] font-bold text-base">{item.amount.toLocaleString()} {item.currency}</Text>
                  <View className="flex-row items-center mt-1">
                    <View className={`w-2 h-2 rounded-full mr-1 ${item.verified ? 'bg-green-500' : 'bg-red-500'}`} />
                    <Text className={`text-xs ${item.verified ? 'text-green-500' : 'text-red-500'}`}>
                      {item.verified ? 'Verified' : 'Invalid'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {(!history?.data || history.data.length === 0) && !isLoading && (
              <View className="items-center py-12">
                <Ionicons name="receipt-outline" size={64} color="#27272A" />
                <Text className="text-zinc-600 text-lg mt-4 text-center">No recent activity yet. Your verified payments will appear here.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
