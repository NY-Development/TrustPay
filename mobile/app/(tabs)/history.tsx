import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export default function History() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: history, isLoading, refetch } = useVerificationHistory();
  const [search, setSearch] = React.useState('');
  const router = useRouter();

  const filteredHistory = history?.data?.filter(item => 
    item.transactionId.toLowerCase().includes(search.toLowerCase()) || 
    item.payerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-background">
      {/* Search Header */}
      <View className="pt-20 px-6 pb-6 bg-card border-b border-border">
        <Text className="text-foreground text-3xl font-bold mb-6">History</Text>
        <View className="bg-muted rounded-2xl h-14 px-4 flex-row items-center border border-border">
          <Ionicons name="search" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by ID or name..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            className="flex-1 h-full text-foreground ml-3"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={isDark ? '#3b82f6' : '#003ec7'} />}
      >
        {filteredHistory?.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => router.push(`/verification/${item._id || item.id}` as any)}
            className="bg-card border border-border rounded-3xl p-5 mb-4 shadow-sm active:opacity-80"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Ionicons 
                    name={item.source === 'screenshot' ? 'image' : item.source === 'qr' ? 'qr-code' : 'create'} 
                    size={20} 
                    color={isDark ? '#3b82f6' : '#003ec7'} 
                  />
                </View>
                <View>
                  <Text className="text-foreground font-bold text-base uppercase">{item.transactionId}</Text>
                  <Text className="text-muted-foreground text-xs">{item.provider} • {item.source}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-foreground font-bold text-base">{item.amount.toLocaleString()} {item.currency}</Text>
                <Text className="text-muted-foreground text-xs">{format(new Date(item.paymentDate), 'MMM dd, yyyy')}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-border w-full mb-4" />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="person-circle-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-muted-foreground text-sm ml-2">{item.payerName}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${item.verified ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <Text className={`text-xs font-bold ${item.verified ? 'text-green-500' : 'text-red-500'}`}>
                  {item.verified ? 'VERIFIED' : 'FAILED'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {(!filteredHistory || filteredHistory.length === 0) && !isLoading && (
          <View className="items-center py-20">
            <View className="w-24 h-24 rounded-full bg-muted border border-border items-center justify-center mb-6">
              <Ionicons name="search" size={40} color={isDark ? '#475569' : '#e2e8f0'} />
            </View>
            <Text className="text-foreground text-xl font-bold">No results found</Text>
            <Text className="text-muted-foreground mt-2 text-center">Try adjusting your search criteria or check back later.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
