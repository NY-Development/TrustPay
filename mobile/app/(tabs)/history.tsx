import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useVerificationHistory } from '@/src/hooks/useVerification'; 
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router'; // 💡 FIXED: Import direct global router object to prevent context drops

const PROVIDERS = [
  { id: 'all', label: 'All Channels' },
  { id: 'cbe', label: 'CBE' },
  { id: 'telebirr', label: 'Telebirr' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'awash', label: 'Awash' },
];

export default function History() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [search, setSearch] = React.useState('');
  const [selectedProvider, setSelectedProvider] = React.useState('all');
  const limit = 15;

  const { 
    data: infiniteHistory, 
    isLoading, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useVerificationHistory({
    limit,
  });

  // 💡 FIXED: Adaptive data flattening layer to safely parse both unpaginated flat arrays and paginated object feeds
  const historyItems = React.useMemo(() => {
    if (!infiniteHistory?.pages) return [];
    
    return infiniteHistory.pages.flatMap((page: any) => {
      if (!page) return [];
      // If the backend returned a direct array wrapper inside data (business-history)
      if (Array.isArray(page.data)) return page.data;
      // If the page itself is the direct array response
      if (Array.isArray(page)) return page;
      return [];
    });
  }, [infiniteHistory]);

  // Multi-tier client-side filtering execution block (Search + Channel Provider matching)[cite: 44]
  const filteredHistory = React.useMemo(() => {
    return historyItems.filter((item: any) => {
      if (!item) return false;
      const targetSearch = search.toLowerCase();
      
      const itemTxId = item.transactionId ? String(item.transactionId).toLowerCase() : '';
      const itemRefNo = item.referenceNumber ? String(item.referenceNumber).toLowerCase() : '';
      const itemPayer = item.payerName ? String(item.payerName).toLowerCase() : '';
      
      // Supporting both 'bank' and 'provider' variants returned from schemas safely
      const rawProvider = item.provider || item.bank || '';
      const itemProvider = String(rawProvider).toLowerCase();

      const matchesSearch = 
        itemTxId.includes(targetSearch) || 
        itemRefNo.includes(targetSearch) ||
        itemPayer.includes(targetSearch);
        
      const matchesProvider = 
        selectedProvider === 'all' || 
        itemProvider === selectedProvider.toLowerCase();

      return matchesSearch && matchesProvider;
    });
  }, [historyItems, search, selectedProvider]);

  // Safe Date Formatter formatting barrier to intercept date-fns crashes
  const formatPaymentDate = (dateString: any) => {
    if (!dateString) return '...';
    try {
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) return '...';
      return format(parsedDate, 'MMM dd, yyyy');
    } catch {
      return '...';
    }
  };

  // Live analytics aggregated on top of currently fetched cluster pools[cite: 44]
  const successfulCount = filteredHistory.filter((v: any) => v?.verified).length;
  const totalVolume = filteredHistory.reduce((acc: number, cur: any) => acc + (Number(cur?.amount) || 0), 0);

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
  };

  // Safe router navigation wrapper that protects the context path[cite: 44]
  const handleNavigateToDetails = (item: any) => {
    const targetId = item?._id || item?.id || item?.referenceNumber;
    
    if (!targetId) {
      Alert.alert('Navigation Error', 'Could not locate a valid reference index for this item.');
      return;
    }

    requestAnimationFrame(() => {
      router.push(`/verification/${targetId}`);
    });
  };

  return (
    <View className="flex-1 bg-background relative">
      {/* Background Micro Watermark Layer */}
      <View pointerEvents="none" className="absolute inset-0 flex items-center justify-center overflow-hidden z-0">
        <Text style={{ transform: [{ rotate: '-35deg' }] }} className="text-foreground font-black text-[96px] tracking-widest uppercase opacity-[0.03] dark:opacity-[0.02] text-center select-none">
          Trust Pay
        </Text>
      </View>

      <SafeAreaView className="flex-1 z-10" edges={['top']}>
        {/* Interactive Filter and Search Header Panel */}
        <View className="px-6 pb-4 pt-2 border-b border-border bg-card/50 backdrop-blur-md">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-foreground text-3xl font-black tracking-tight">Ledger History</Text>
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-0.5">Audit Logs & Settlement Feeds</Text>
            </View>
          </View>

          {/* Micro Analytical Counter Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-background border border-border/60 rounded-2xl p-3 flex-row items-center">
              <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
              <Text className="text-muted-foreground text-xs ml-2 font-medium">
                Verified: <Text className="text-foreground font-bold">{successfulCount}</Text>
              </Text>
            </View>
            <View className="flex-1 bg-background border border-border/60 rounded-2xl p-3 flex-row items-center">
              <Ionicons name="cash-outline" size={16} color={isDark ? '#3b82f6' : '#003ec7'} />
              <Text className="text-muted-foreground text-xs ml-2 font-medium truncate">
                Vol: <Text className="text-foreground font-bold">{totalVolume.toLocaleString()}</Text>
              </Text>
            </View>
          </View>

          {/* Interactive Input Bar */}
          <View className="bg-background rounded-2xl h-14 px-4 flex-row items-center border border-input mb-4 shadow-inner">
            <Ionicons name="search-outline" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Filter by reference number or name..."
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              className="flex-1 h-full text-foreground ml-3 font-medium text-sm"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal Provider Filter Carousel Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1" contentContainerStyle={{ gap: 8 }}>
            {PROVIDERS.map((prov) => {
              const isSelected = selectedProvider === prov.id;
              return (
                <TouchableOpacity
                  key={prov.id}
                  onPress={() => handleProviderChange(prov.id)}
                  className={`px-4 py-2 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-primary border-primary shadow-sm shadow-primary/20' 
                      : 'bg-background border-border active:bg-muted'
                  }`}
                >
                  <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                    {prov.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Scrollable Document Feed */}
        <ScrollView 
          className="flex-1 px-6 pt-4"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={isDark ? '#3b82f6' : '#003ec7'} />}
        >
          {filteredHistory?.map((item: any, i: number) => (
            <TouchableOpacity
              key={item._id || item.id || i}
              onPress={() => handleNavigateToDetails(item)}
              activeOpacity={0.9}
              className="bg-card border border-border rounded-[28px] p-5 mb-4 shadow-sm active:scale-[0.99]"
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-12 h-12 rounded-2xl bg-muted border border-border items-center justify-center mr-3">
                    <Ionicons 
                      name={item.source === 'screenshot' ? 'image-outline' : item.source === 'qr' ? 'qr-code-outline' : 'duplicate-outline'} 
                      size={22} 
                      color={isDark ? '#3b82f6' : '#003ec7'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-black text-base uppercase tracking-tight truncate">
                      {item.transactionId || item.referenceNumber || 'UNKNOWN REF'}
                    </Text>
                    <View className="flex-row items-center mt-0.5 gap-1.5">
                      <Text className="text-muted-foreground text-xs font-semibold uppercase">{item.provider || item.bank || 'N/A'}</Text>
                      <View className="w-1 h-1 bg-muted-foreground rounded-full opacity-40" />
                      <Text className="text-muted-foreground text-xs font-medium capitalize">{item.source || 'manual'}</Text>
                    </View>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-foreground font-black text-base tracking-tight">
                    {Number(item.amount || 0).toLocaleString()} <Text className="text-xs font-bold text-muted-foreground">{item.currency || 'ETB'}</Text>
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-0.5 font-medium">
                    {formatPaymentDate(item.paymentDate)}
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-border w-full mb-4 opacity-60" />

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1 pr-4">
                  <Ionicons name="person-circle" size={18} color="#94a3b8" />
                  <Text className="text-muted-foreground text-sm font-medium ml-2 truncate">{item.payerName || 'Unknown Payer'}</Text>
                </View>
                
                <View className={`px-3 py-1 rounded-full border ${
                  item.verified ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'
                }`}>
                  <Text className={`text-[10px] font-black tracking-wider ${item.verified ? 'text-emerald-500' : 'text-destructive'}`}>
                    {item.verified ? 'VERIFIED' : 'FAILED'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Load More Button leveraging Infinite Query parameters */}
          {filteredHistory && filteredHistory.length > 0 && hasNextPage && (
            <TouchableOpacity 
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-2 mb-6 bg-card border border-border h-14 rounded-2xl items-center justify-center active:bg-muted"
            >
              {isFetchingNextPage ? (
                <ActivityIndicator color={isDark ? '#3b82f6' : '#003ec7'} />
              ) : (
                <Text className="text-primary font-bold text-sm">Load More Ledger Activities</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Structural Empty State UI Layout */}
          {(!filteredHistory || filteredHistory.length === 0) && !isLoading && (
            <View className="items-center py-20 bg-card/40 border border-dashed border-border rounded-[32px] mt-4 px-6">
              <View className="w-16 h-16 rounded-2xl bg-muted border border-border items-center justify-center mb-4">
                <Ionicons name="trail-sign-outline" size={26} color={isDark ? '#475569' : '#94a3b8'} />
              </View>
              <Text className="text-foreground text-lg font-bold">No Records Resolved</Text>
              <Text className="text-muted-foreground mt-2 text-center text-sm max-w-[260px] leading-5">
                Adjust your channel filtering or entry tokens above to sync data records.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}