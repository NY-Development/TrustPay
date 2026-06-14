import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function History() {
  const { data: history, isLoading, refetch } = useVerificationHistory();
  const [search, setSearch] = React.useState('');

  const filteredHistory = history?.data?.filter(item => 
    item.transactionId.toLowerCase().includes(search.toLowerCase()) || 
    item.payerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-black">
      {/* Search Header */}
      <View className="pt-20 px-6 pb-6 bg-[#1A1A1A]">
        <Text className="text-white text-3xl font-bold mb-6">History</Text>
        <View className="bg-zinc-800 rounded-2xl h-14 px-4 flex-row items-center border border-zinc-700">
          <Ionicons name="search" size={20} color="#71717A" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by ID or name..."
            placeholderTextColor="#52525B"
            className="flex-1 h-full text-white ml-3"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#71717A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00E5FF" />}
      >
        {filteredHistory?.map((item, i) => (
          <View key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-[#00E5FF10] items-center justify-center mr-3">
                  <Ionicons 
                    name={item.source === 'screenshot' ? 'image' : item.source === 'qr' ? 'qr-code' : 'create'} 
                    size={20} 
                    color="#00E5FF" 
                  />
                </View>
                <View>
                  <Text className="text-white font-bold text-base uppercase">{item.transactionId}</Text>
                  <Text className="text-zinc-500 text-xs">{item.provider} • {item.source}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold text-base">{item.amount.toLocaleString()} {item.currency}</Text>
                <Text className="text-zinc-500 text-xs">{format(new Date(item.paymentDate), 'MMM dd, yyyy')}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-zinc-800 w-full mb-4" />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="person-circle-outline" size={18} color="#71717A" />
                <Text className="text-zinc-400 text-sm ml-2">{item.payerName}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${item.verified ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <Text className={`text-xs font-bold ${item.verified ? 'text-green-500' : 'text-red-500'}`}>
                  {item.verified ? 'VERIFIED' : 'FAILED'}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {(!filteredHistory || filteredHistory.length === 0) && !isLoading && (
          <View className="items-center py-20">
            <View className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center mb-6">
              <Ionicons name="search" size={40} color="#27272A" />
            </View>
            <Text className="text-white text-xl font-bold">No results found</Text>
            <Text className="text-zinc-500 mt-2 text-center">Try adjusting your search criteria or check back later.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
