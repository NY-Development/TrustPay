import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVerificationHistory } from '@/src/hooks/useVerification';

export default function Disputes() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { data: historyRes, refetch } = useVerificationHistory();
  
  // Safely flatten multi-page infinite dataset chunks instead of reading historyRes.data directly
  const history = historyRes?.pages?.flatMap(page => page.data) || [];

  // Filter for items requiring attention (frauds or duplicates)
  const flaggedItems = React.useMemo(() => {
    return history.filter((record) => {
      const isFraud = record.verificationSummary?.severity === 'fraud_risk';
      const isDuplicate = record.verificationSummary?.severity === 'duplicate' || 
                          (record.rawResponse?.confirmationHistory && 
                            record.rawResponse.confirmationHistory.confirmationCount > 1);
      return isFraud || isDuplicate;
    });
  }, [history]);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center bg-card border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-foreground text-2xl font-bold flex-1">Flagged Disputes</Text>
          <View className="bg-red-500/10 px-3 py-1 rounded-full">
            <Text className="text-red-500 text-xs font-bold">{flaggedItems.length} Alerted</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
          {flaggedItems.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <View className="w-16 h-16 bg-green-500/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="shield-checkmark" size={32} color="#22c55e" />
              </View>
              <Text className="text-foreground font-bold text-lg">All Clean!</Text>
              <Text className="text-muted-foreground text-sm text-center px-6 mt-1">
                No high-severity duplicate attempts or fraudulent transaction slips require merchant mediation right now.
              </Text>
            </View>
          ) : (
            flaggedItems.map((item) => {
              const isFraud = item.verificationSummary?.severity === 'fraud_risk';
              return (
                <View key={item.id} className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center">
                      <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isFraud ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                        <Ionicons name={isFraud ? 'warning-outline' : 'copy'} size={16} color={isFraud ? '#ef4444' : '#f59e0b'} />
                      </View>
                      <View>
                        <Text className="text-foreground font-bold text-base capitalize">{item.provider || 'Unknown Provider'}</Text>
                        <Text className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <Text className="text-foreground font-extrabold text-base">{item.amount || 0} ETB</Text>
                  </View>

                  <View className="bg-muted p-3 rounded-xl mb-4">
                    <Text className="text-foreground font-medium text-xs">Reason Blocked:</Text>
                    <Text className="text-muted-foreground text-xs mt-0.5">
                      {isFraud ? 'Detected anomaly matching blacklisted transaction signatures.' : 'Reference code reuse detected against historical platform settlements.'}
                    </Text>
                  </View>

                  <View className="flex-row space-x-2 gap-2">
                    <TouchableOpacity className="flex-1 bg-muted border border-border h-11 rounded-xl items-center justify-center">
                      <Text className="text-muted-foreground font-bold text-xs">Dismiss Slip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ backgroundColor: themePrimary }}
                      className="flex-1 h-11 rounded-xl items-center justify-center"
                    >
                      <Text className="text-white font-bold text-xs">Force Settle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}