import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { useVerifyManual } from '@/src/hooks/useVerification';
import { StatusModal } from '@/src/components/StatusModal';
import { normalizeVerificationResponse } from '@/src/mappers/verification.mapper';
import { detectProvider } from '@/src/utils/provider-detector';

export default function QRScanner() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifiedId, setVerifiedId] = useState<string | null>(null);

  const [modal, setModal] = useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  const verifyMutation = useVerifyManual();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    let reference = data;

    try {
      const parsed = JSON.parse(data);
      reference =
        parsed.reference ||
        parsed.txnId ||
        parsed.transactionId ||
        data;
    } catch {}

    const provider = detectProvider(reference);

    verifyMutation.mutate(
      { reference, provider },
      {
        onSuccess: (res: any) => {
          if (res.success && res.data) {
            setVerifiedId(res.data._id || res.data.id);
          }
          const normalized = normalizeVerificationResponse(res);

          setModal({
            visible: true,
            type:
              normalized.severity.severity === 'fraud_risk' ||
              normalized.severity.severity === 'duplicate'
                ? 'error'
                : normalized.ui.type === 'success'
                ? 'success'
                : 'error',
            title: normalized.ui.title,
            message:
              normalized.ui.description ||
              normalized.message ||
              'Verification completed',
          });
        },
        onError: (err: any) => {
          setScanned(false);
          setModal({
            visible: true,
            type: 'error',
            title: 'Verification Error',
            message:
              err?.response?.data?.message ||
              'Could not verify QR code.',
          });
        },
      }
    );
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={themePrimary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="camera-outline" size={64} color={themePrimary} />
        <Text className="text-foreground text-xl font-bold mt-6 text-center">
          Camera Permission Required
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="bg-primary px-10 h-14 rounded-2xl mt-6 items-center justify-center"
        >
          <Text className="text-primary-foreground font-bold">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View className="flex-1 bg-black/40">
          <View className="pt-20 px-6 flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-12 h-12 rounded-full bg-black/50 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-2xl font-bold ml-4">
              Scan QR Code
            </Text>
          </View>

          <View className="flex-1 items-center justify-center">
            <View className="w-72 h-72 border-2 border-primary rounded-[40px] items-center justify-center">
              {verifyMutation.isPending && (
                <ActivityIndicator size="large" color={themePrimary} />
              )}
            </View>

            <Text className="text-white/60 mt-10 text-center">
              Align QR code inside frame
            </Text>
          </View>

          <View className="pb-20 px-6 items-center">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/verify/manual')}
              className="bg-card h-14 px-8 rounded-full border border-border items-center justify-center"
            >
              <Text className="text-foreground font-semibold">
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      <StatusModal
        {...modal}
        onClose={() => {
          setModal((p) => ({ ...p, visible: false }));
          setScanned(false);
          if (modal.type === 'success' && verifiedId) {
            router.replace(`/verification/${verifiedId}` as any);
          }
        }}
      />
    </View>
  );
}