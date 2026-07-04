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

import { useVerifyUniversal } from '@/src/hooks/useVerification';
import { StatusModal } from '@/src/components/StatusModal';

export default function QRScanner() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const [modal, setModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const verifyMutation = useVerifyUniversal();

  /**
   * HANDLE QR SCAN
   */
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    let reference = data;

    try {
      const parsed = JSON.parse(data);
      reference = parsed.reference || parsed.txnId || parsed.transactionId || data;
    } catch {
      // raw string fallback
    }

    verifyMutation.mutate(
      { reference },
      {
        onSuccess: (res: any) => {
          setModal({
            visible: true,
            type: res.success ? 'success' : 'error',
            title: res.success ? 'Verified' : 'Verification Failed',
            message:
              res.message || 'QR code processed successfully.',
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
              'Could not verify QR code. Please try again.',
          });
        },
      }
    );
  };

  /**
   * PERMISSION STATES
   */
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

        <Text className="text-muted-foreground mt-2 text-center mb-10">
          Enable camera access to scan payment QR codes.
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="bg-primary px-10 h-14 rounded-2xl items-center justify-center"
        >
          <Text className="text-primary-foreground font-bold text-lg">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * UI
   */
  return (
    <View className="flex-1 bg-background">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View className="flex-1 bg-black/40">
          {/* HEADER */}
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

          {/* SCANNER BOX */}
          <View className="flex-1 items-center justify-center">
            <View className="w-72 h-72 border-2 border-primary rounded-[40px] items-center justify-center">
              <View className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary" />
              <View className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary" />
              <View className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary" />
              <View className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary" />

              {verifyMutation.isPending && (
                <View className="items-center">
                  <ActivityIndicator size="large" color={themePrimary} />
                  <Text className="text-white font-bold mt-4">
                    Verifying...
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-white/60 text-base mt-10 text-center px-12">
              Align the QR code inside the frame to verify payment.
            </Text>
          </View>

          {/* BOTTOM ACTION */}
          <View className="pb-20 px-6 items-center">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/verify/manual')}
              className="bg-card h-14 px-8 rounded-full items-center justify-center border border-border"
            >
              <Text className="text-foreground font-semibold">
                Enter Code Manually
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* MODAL */}
      <StatusModal
        {...modal}
        onClose={() => {
          setModal((p) => ({ ...p, visible: false }));

          if (modal.type === 'success') {
            router.replace('/(tabs)');
          } else {
            setScanned(false);
          }
        }}
      />
    </View>
  );
}