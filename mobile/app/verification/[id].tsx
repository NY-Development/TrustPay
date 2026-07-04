import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Clipboard from 'expo-clipboard';

import { useVerificationDetail } from '@/src/hooks/useVerification';
import { normalizeVerificationResponse } from '@/src/mappers/verification.mapper';

export default function VerificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { data, isLoading, error } = useVerificationDetail(id || '');

  const [showRaw, setShowRaw] = React.useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={themePrimary} />
      </View>
    );
  }

  if (error || !data?.success) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Ionicons name="alert-circle" size={48} color="red" />
        <Text className="text-foreground font-bold text-xl mt-4">
          Failed to load verification
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const normalized = normalizeVerificationResponse(data);

  const tx = normalized.transaction;
  const severity = normalized.severity;

  const badgeColor = {
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
    fraud_risk: '#ef4444',
    duplicate: '#a855f7',
    error: '#ef4444',
  }[severity.severity];

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 pt-6 mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>

          <Text className="text-foreground font-bold text-lg">
            Verification Detail
          </Text>

          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="px-6">
          {/* SEVERITY CARD */}
          <View className="bg-card p-6 rounded-3xl mb-6 items-center">
            <Text className="text-muted-foreground text-xs">
              SEVERITY
            </Text>

            <View
              className="px-4 py-2 rounded-full mt-2"
              style={{ backgroundColor: `${badgeColor}20` }}
            >
              <Text style={{ color: badgeColor, fontWeight: '700' }}>
                {severity.severity.toUpperCase()}
              </Text>
            </View>

            <Text className="text-3xl font-bold mt-4 text-foreground">
              {tx.amount} ETB
            </Text>

            <Text className="text-muted-foreground mt-1">
              {normalized.ui.title}
            </Text>
          </View>

          {/* TRANSACTION CORE */}
          <Section title="Transaction">
            <Row label="Reference" value={tx.referenceNumber} />
            <Row label="Sender" value={tx.senderName} />
            <Row label="Receiver" value={tx.receiverName} />
            <Row label="Bank" value={tx.bank} />
            <Row label="Time" value={tx.timestamp} />
          </Section>

          {/* SETTLEMENT */}
          <Section title="Settlement Match">
            <Row
              label="Matched"
              value={tx.settlementAccountMatch?.matched ? 'YES' : 'NO'}
            />
            <Row
              label="Confidence"
              value={tx.settlementAccountMatch?.matchConfidence}
            />
            <Row
              label="Reason"
              value={tx.settlementAccountMatch?.reason}
            />
          </Section>

          {/* CONFIRMATION */}
          <Section title="Confirmation History">
            <Row
              label="Count"
              value={tx.confirmationHistory?.confirmationCount}
            />
            <Row
              label="First"
              value={tx.confirmationHistory?.firstConfirmedAt}
            />
          </Section>

          {/* RAW */}
          <TouchableOpacity
            onPress={() => setShowRaw(!showRaw)}
            className="mt-6"
          >
            <Text className="text-primary font-semibold">
              Toggle Raw JSON
            </Text>
          </TouchableOpacity>

          {showRaw && (
            <View className="bg-muted p-4 rounded-xl mt-3">
              <TouchableOpacity
                onPress={async () =>
                  await Clipboard.setStringAsync(
                    JSON.stringify(data, null, 2)
                  )
                }
              >
                <Text className="text-xs text-muted-foreground mb-2">
                  Tap to copy
                </Text>
              </TouchableOpacity>

              <Text className="text-xs text-foreground">
                {JSON.stringify(data, null, 2)}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ---------------- HELPERS ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="text-foreground font-bold mb-2">{title}</Text>
      <View className="bg-card rounded-2xl p-4">{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-border">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className="text-foreground font-semibold max-w-[60%] text-right">
        {String(value ?? 'N/A')}
      </Text>
    </View>
  );
}