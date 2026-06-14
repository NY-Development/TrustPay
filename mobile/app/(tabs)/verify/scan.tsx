import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVerifyUniversal } from '../../../src/hooks/useVerification';
import { StatusModal } from '../../../src/components/StatusModal';

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: 'info', title: '', message: '' });
  
  const verifyMutation = useVerifyUniversal();

  if (!permission) {
    return <View className="flex-1 bg-black items-center justify-center"><ActivityIndicator color="#00E5FF" /></View>;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Ionicons name="camera-outline" size={64} color="#00E5FF" />
        <Text className="text-white text-xl font-bold mt-6 text-center">Camera Access Required</Text>
        <Text className="text-zinc-500 mt-2 text-center mb-10">We need your permission to show the camera for QR scanning.</Text>
        <TouchableOpacity 
          onPress={requestPermission}
          className="bg-[#00E5FF] px-10 h-14 rounded-2xl items-center justify-center"
        >
          <Text className="text-black font-bold text-lg">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Assume the QR data is the reference or a JSON containing it
    let reference = data;
    try {
      const parsed = JSON.parse(data);
      reference = parsed.reference || parsed.txnId || data;
    } catch {
      // Just use the raw data if not JSON
    }

    verifyMutation.mutate({ reference }, {
      onSuccess: (res) => {
        setModal({
          visible: true,
          type: res.success ? 'success' : 'error',
          title: res.success ? 'QR Verified' : 'Scan Failed',
          message: res.message || 'Payment successfully verified via QR scan.'
        });
      },
      onError: (err: any) => {
        setScanned(false);
        setModal({
          visible: true,
          type: 'error',
          title: 'Connection Error',
          message: err.response?.data?.message || 'Could not verify QR code. Please check your connection.'
        });
      }
    });
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View className="flex-1 bg-black/40">
          {/* Header */}
          <View className="pt-20 px-6 flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold ml-4">Scan QR Code</Text>
          </View>

          {/* Scanner Overlay */}
          <View className="flex-1 items-center justify-center">
            <View className="w-72 h-72 border-2 border-[#00E5FF] rounded-[40px] items-center justify-center">
              <View className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-[#00E5FF]" />
              <View className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-[#00E5FF]" />
              <View className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-[#00E5FF]" />
              <View className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-[#00E5FF]" />
              
              {verifyMutation.isPending && (
                <View className="items-center">
                  <ActivityIndicator size="large" color="#00E5FF" />
                  <Text className="text-white font-bold mt-4">Verifying...</Text>
                </View>
              )}
            </View>
            <Text className="text-white/60 text-base mt-10 text-center px-12">
              Align the payment QR code within the frame to verify automatically.
            </Text>
          </View>

          {/* Bottom Bar */}
          <View className="pb-20 px-6 items-center">
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/verify/manual')}
              className="bg-zinc-900 h-14 px-8 rounded-full items-center justify-center border border-zinc-800"
            >
              <Text className="text-white font-semibold">Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      <StatusModal 
        {...modal} 
        onClose={() => {
          setModal({ ...modal, visible: false });
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
