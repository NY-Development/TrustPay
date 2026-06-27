import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useVerificationDetail } from '../../src/hooks/useVerification';
import { format } from 'date-fns';

export default function VerificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { data: response, isLoading, error } = useVerificationDetail(id || '');
  const [showRaw, setShowRaw] = React.useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={themePrimary} />
      </View>
    );
  }

  if (error || !response?.success || !response.data) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <View className="w-16 h-16 rounded-full bg-destructive/10 items-center justify-center mb-6">
          <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
        </View>
        <Text className="text-foreground text-2xl font-bold text-center">Trouble Loading Details</Text>
        <Text className="text-muted-foreground mt-2 text-center">
          The verification record count not be retrieved. Please try again.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 bg-primary h-14 px-8 rounded-2xl items-center justify-center active:opacity-90"
        >
          <Text className="text-primary-foreground font-bold text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ver = response.data;
  const isSuccess = ver.status === 'completed' || ver.verified;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        {/* Header toolbar */}
        <View className="pt-6 px-6 flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 rounded-full bg-muted items-center justify-center active:opacity-80"
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">Verification Detail</Text>
          <View className="w-12" /> {/* alignment spacer */}
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Status highlight card */}
          <View className="bg-card border border-border p-6 rounded-[32px] items-center mb-6 shadow-sm">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                isSuccess ? 'bg-green-500/10' : 'bg-destructive/10'
              }`}
            >
              <Ionicons
                name={isSuccess ? 'checkmark-circle' : 'close-circle'}
                size={34}
                color={isSuccess ? '#22c55e' : '#ef4444'}
              />
            </View>

            <Text className="text-muted-foreground text-sm uppercase tracking-widest font-semibold">
              Payment Amount
            </Text>
            <Text className="text-foreground text-3xl font-extrabold mt-1">
              {ver.amount} <Text className="text-lg font-bold text-muted-foreground">{ver.currency || 'ETB'}</Text>
            </Text>

            <View
              className={`mt-4 px-4 py-1.5 rounded-full ${
                isSuccess ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'
              }`}
            >
              <Text className={`text-xs font-bold ${isSuccess ? 'text-green-500' : 'text-destructive'}`}>
                {isSuccess ? 'VERIFIED PAYMENT' : 'VERIFICATION FAILED'}
              </Text>
            </View>
          </View>

          {/* Details Section */}
          <Text className="text-foreground text-lg font-bold mb-3 pl-1">Transaction Info</Text>
          <View className="bg-card border border-border rounded-[28px] p-5 mb-6 space-y-4 shadow-xs">
            <DetailRow label="Reference ID" value={ver.transactionId} highlight />
            <DetailRow label="Bank Provider" value={ver.provider ? ver.provider.toUpperCase() : 'UNKNOWN'} />
            <DetailRow label="Payer Name" value={ver.payerName || 'N/A'} />
            {ver.receiverName && <DetailRow label="Receiver Name" value={ver.receiverName} />}
            {ver.receiverAccount && <DetailRow label="Settlement Account" value={ver.receiverAccount} />}
            <DetailRow
              label="Transaction Date"
              value={ver.paymentDate ? format(new Date(ver.paymentDate), 'PPP, hh:mm a') : 'N/A'}
            />
            <DetailRow label="Method" value={ver.source ? ver.source.toUpperCase() : 'MANUAL'} />
            <DetailRow
              label="Verified On"
              value={ver.createdAt ? format(new Date(ver.createdAt), 'PPP, hh:mm a') : 'N/A'}
            />
          </View>

          {/* Advanced Raw Response accordion */}
          {ver.rawResponse && (
            <View className="mb-10">
              <TouchableOpacity
                onPress={() => setShowRaw(!showRaw)}
                className="flex-row items-center justify-between py-3 border-b border-border"
              >
                <Text className="text-muted-foreground text-sm font-semibold">Developers Raw JSON Payload</Text>
                <Ionicons
                  name={showRaw ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={isDark ? '#64748b' : '#94a3b8'}
                />
              </TouchableOpacity>

              {showRaw && (
                <View className="bg-muted p-4 rounded-2xl mt-3 border border-border">
                  <Text className="font-mono text-xs text-muted-foreground leading-5">
                    {JSON.stringify(ver.rawResponse, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-border/40 last:border-b-0">
      <Text className="text-muted-foreground text-sm font-medium">{label}</Text>
      <Text
        className={`text-foreground text-sm font-semibold max-w-[65%] text-right ${
          highlight ? 'text-primary' : ''
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
