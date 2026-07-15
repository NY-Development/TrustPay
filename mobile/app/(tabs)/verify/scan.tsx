import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useVerifyManual } from '@/src/hooks/useVerification';
import { StatusModal } from '@/src/components/StatusModal';

import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { extractText } from '@/src/ai/ocr-processor';
import { useAI } from '@/src/ai/AIProvider';
import { AI_MODELS, isDownloaded, deleteModel } from '@/src/ai/model-download-manager';
import { useGlobalDownload } from '@/src/context/DownloadContext';
import { normalizeVerificationResponse } from '@/src/mappers/verification.mapper';
import { detectProvider } from '@/src/utils/provider-detector';
import type { AIModelId } from '@/src/ai/ai-types';

const MODEL_STORAGE_KEY = 'trustpay_selected_ai_model';

type AppPhase = 'checking' | 'selecting' | 'downloading' | 'ready';

export default function UnifiedScanner() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const cameraRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const { organizer, status: aiStatus } = useAI();
  const { downloadingModelId, progress: dlProgress, startGlobalDownload } = useGlobalDownload();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [verifiedId, setVerifiedId] = useState<string | null>(null);
  const [refNo, setRefNo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [phase, setPhase] = useState<AppPhase>('checking');
  const [selectedModel, setSelectedModel] = useState<AIModelId | null>(null);

  const [modal, setModal] = useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
    isVerificationFailure: false,
  });

  const verifyManualMutation = useVerifyManual();

  useEffect(() => {
    if (downloadingModelId) {
      setSelectedModel(downloadingModelId);
      setPhase('downloading');
    }
  }, [downloadingModelId]);

  useEffect(() => {
    const load = async () => {
      try {
        if (downloadingModelId) return;

        const saved = await AsyncStorage.getItem(MODEL_STORAGE_KEY);
        if (saved) {
          setSelectedModel(saved as AIModelId);
          await initializeModel(saved as AIModelId);
        } else {
          // Default to receipt-parser auto-initialize
          await initializeModel('receipt-parser');
        }
      } catch (err) {
        console.warn('[Unified Scan Storage Load Catch]', err);
        setPhase('selecting');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (phase === 'downloading' && !downloadingModelId && selectedModel) {
      setPhase('ready');
    }
  }, [downloadingModelId, phase, selectedModel]);

  const initializeModel = async (modelId: AIModelId) => {
    try {
      const alreadyDownloaded = await isDownloaded(modelId);
      if (!alreadyDownloaded) {
        setPhase('downloading');
        await startGlobalDownload(modelId);
        return;
      }
      setSelectedModel(modelId);
      await AsyncStorage.setItem(MODEL_STORAGE_KEY, modelId);
      setPhase('ready');
    } catch (err) {
      console.error('[Scan Init Error]', err);
      setPhase('selecting');
    }
  };

  const handleSelectModel = async (modelId: AIModelId) => {
    setSelectedModel(modelId);
    await initializeModel(modelId);
  };

  const handleVerification = (ai: any) => {
    const extractedRef = ai?.referenceNumber || ai?.transactionNumber || ai?.receiptNumber || null;
    setRefNo(extractedRef);

    if (!extractedRef) {
      setProcessing(false);
      setModal({
        visible: true,
        type: 'error',
        title: 'Reference Missing',
        message: 'Could not extract a valid transaction reference number from the document.',
        isVerificationFailure: false,
      });
      return;
    }

    setReferenceId(extractedRef);
    const detected = ai?.bank || detectProvider(extractedRef);

    verifyManualMutation.mutate(
      { reference: extractedRef, provider: detected },
      {
        onSuccess: (res: any) => {
          if (res.success && res.data) {
            setVerifiedId(res.data._id || res.data.id);
          }
          const normalized = normalizeVerificationResponse(res);
          setProcessing(false);
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
            message: normalized.ui.description || normalized.message || 'Verification completed',
            isVerificationFailure: false,
          });
        },
        onError: (err : any) => {
          setProcessing(false);
          setModal({
            visible: true,
            type: 'error',
            title: 'Verification Failed',
            message: err.response?.data?.message || `Could not verify transaction reference: ${extractedRef}.\n\nWould you like to try manual confirmation?`,
            isVerificationFailure: true,
          });
        },
      }
    );
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isProcessingRef.current || processing || imageUri || !data) return;
    isProcessingRef.current = true;
    setProcessing(true);

    let reference = data.trim();
    if (reference.startsWith('{')) {
      try {
        const parsed = JSON.parse(reference);
        reference = parsed.reference || parsed.txnId || parsed.transactionId || reference;
      } catch {}
    }

    const provider = detectProvider(reference);
    setReferenceId(reference);

    verifyManualMutation.mutate(
      { reference, provider },
      {
        onSuccess: (res: any) => {
          if (res.success && res.data) {
            setVerifiedId(res.data._id || res.data.id);
          }
          const normalized = normalizeVerificationResponse(res);
          setProcessing(false);
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
            message: normalized.ui.description || normalized.message || 'Verification completed',
            isVerificationFailure: false,
          });
        },
        onError: (err: any) => {
          setProcessing(false);
          setModal({
            visible: true,
            type: 'error',
            title: 'QR Scan Error',
            message: err?.response?.data?.message || 'Verification payload check rejected.',
            isVerificationFailure: false,
          });
        },
        onSettled: () => {
          // 4. Ensure references unlock only AFTER modal closes or resets
          // Clean up in a single callback block to avoid missed unlocks
          setProcessing(false);
          // NOTE: If you want to keep it locked while the modal is open,
          // move 'isProcessingRef.current = false' to your Modal's onClose() handler!
          isProcessingRef.current = false; 
        }
      }
    );
  };

  const takeReceiptSnapshot = async () => {
    if (!cameraRef.current || processing) return;

    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (photo?.uri) {
        setImageUri(photo.uri);

        const rawText = await extractText(photo.uri);
        setOcrText(rawText);

        // Run extraction using AIOrganizer (automatically runs heuristics fallback if models not loaded)
        const extracted = await organizer.extractReceiptData(rawText);
        handleVerification(extracted);
      }
    } catch (err: any) {
      setProcessing(false);
      setModal({
        visible: true,
        type: 'error',
        title: 'Capture Failed',
        message: err.message || 'Error executing on-device image capture pipeline.',
        isVerificationFailure: false,
      });
    }
  };

  if (phase === 'checking' || phase === 'selecting') {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6 relative">
        <SafeAreaView className="w-full absolute top-4 left-6 flex-row items-center z-10">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-muted/50 active:scale-95">
            <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </SafeAreaView>

        {phase === 'checking' ? (
          <ActivityIndicator color={themePrimary} size="large" />
        ) : (
          <View className="bg-card border border-border/80 rounded-[32px] p-6 shadow-2xl w-full max-w-sm">
            <View className="items-center mb-6">
              <View className="bg-primary/10 p-4 rounded-2xl mb-4 border border-primary/20">
                <Ionicons name="sparkles" size={32} color={themePrimary} />
              </View>
              <Text className="text-foreground text-xl font-black tracking-tight text-center">Intelligence Core</Text>
              <Text className="text-muted-foreground text-center text-sm mt-2 leading-5">
                Select a local text processing node. System path directories are synchronized.
              </Text>
            </View>
            {AI_MODELS.map((model) => (
              <TouchableOpacity
                key={model.id}
                onPress={() => handleSelectModel(model.id)}
                className="border border-border/60 bg-muted/20 rounded-2xl p-4 mb-3 active:scale-[0.98] transition-all flex-row justify-between items-center"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-foreground text-md font-bold tracking-wide">{model.label}</Text>
                  <Text className="text-muted-foreground text-xs mt-1" numberOfLines={1}>{model.description}</Text>
                </View>
                <View className="bg-primary/15 px-2.5 py-1 rounded-lg border border-primary/20">
                  <Text className="text-primary text-[11px] font-extrabold tracking-wider">{model.size}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (phase === 'downloading') {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6 relative">
        <SafeAreaView className="w-full absolute top-4 left-6 flex-row items-center z-10">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-muted/50 active:scale-95">
            <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </SafeAreaView>

        <View className="bg-card border border-border/80 rounded-[32px] p-8 items-center justify-center shadow-2xl w-full max-w-sm">
          <ActivityIndicator color={themePrimary} size="large" className="mb-4" />
          <Text className="text-foreground text-lg font-black tracking-tight text-center">Downloading Models...</Text>
          <Text className="text-muted-foreground text-center text-sm mt-2 leading-5 px-2">
            Downloading neural pathways: {(dlProgress?.percent ? dlProgress.percent * 100 : 0).toFixed(0)}%
          </Text>
        </View>
      </View>
    );
  }

  if (!cameraPermission || !cameraPermission.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <View className="bg-primary/10 p-5 rounded-3xl mb-6 border border-primary/20">
          <Ionicons name="camera-outline" size={48} color={themePrimary} />
        </View>
        <Text className="text-foreground text-2xl font-black tracking-tight text-center">Camera Access Required</Text>
        <Text className="text-muted-foreground text-center text-sm mt-2 mb-6 max-w-xs leading-5">
          We need access to the device lens layout configurations to initialize standard scanning.
        </Text>
        <TouchableOpacity onPress={requestCameraPermission} className="bg-primary px-8 h-14 rounded-2xl items-center justify-center shadow-md active:opacity-90">
          <Text className="text-primary-foreground font-bold tracking-wide text-base">Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {!imageUri ? (
        <View className="flex-1 relative">
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={processing ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={processing ? undefined : { barcodeTypes: ['qr'] }}
          />

          {/* Full Screen Immersive HUD Overlay */}
          <SafeAreaView style={StyleSheet.absoluteFillObject} className="justify-between p-6 bg-black/30">
            {/* Header Toolbar floating on canvas */}
            <View className="flex-row items-center justify-between w-full mt-2">
              <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-2xl items-center justify-center border border-white/10 active:scale-95">
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              <View className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-2 ${aiStatus === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <Text className="text-white text-xs font-bold uppercase tracking-widest">
                  AI: {aiStatus.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPhase('selecting')}
                className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-2xl items-center justify-center border border-white/10 active:scale-95"
              >
                <Ionicons name="settings-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Central Target Alignment Area */}
            <View className="items-center justify-center flex-1">
              <View className="w-72 h-72 border-[3px] border-dashed border-white/70 rounded-[48px] items-center justify-center bg-black/10 relative shadow-2xl">
                <View className="absolute top-6 left-6 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-md" />
                <View className="absolute top-6 right-6 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-md" />
                <View className="absolute bottom-6 left-6 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-md" />
                <View className="absolute bottom-6 right-6 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-md" />

                {processing ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <Ionicons name="scan-outline" size={48} color="rgba(255,255,255,0.4)" />
                )}
              </View>
              <View className="bg-black/60 backdrop-blur-md px-5 py-2 rounded-full mt-6 border border-white/5 max-w-[280px]">
                <Text className="text-white/90 text-xs font-medium tracking-wide text-center leading-5">
                  Align QR within boundaries or capture receipt photo
                </Text>
              </View>
            </View>

            {/* Capture Control Panel */}
            <View className="items-center justify-center pb-4">
              <TouchableOpacity
                onPress={takeReceiptSnapshot}
                disabled={processing}
                className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-2xl active:scale-90 border-[6px] border-white/30"
              >
                <Ionicons name="camera" size={32} color="#000000" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        /* Document Analysis Display Staging Board */
        <View className="flex-1 bg-background">
          <SafeAreaView className="flex-1 px-6 pb-6">
            <View className="flex-row items-center justify-between my-4">
              <Text className="text-foreground text-2xl font-black tracking-tight">Analysis Phase</Text>
              <TouchableOpacity
                onPress={() => { setImageUri(null); setOcrText(null); setProcessing(false); }}
                className="bg-muted px-4 h-10 rounded-xl items-center justify-center flex-row border border-border active:scale-95"
              >
                <Ionicons name="refresh" size={16} color={isDark ? 'white' : 'black'} />
                <Text className="text-foreground text-xs font-bold ml-2 tracking-wide">Reset Lens</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Image source={{ uri: imageUri }} className="h-64 rounded-3xl border border-border shadow-sm mb-4" resizeMode="cover" />

              {processing && (
                <View className="bg-primary/5 p-4 rounded-2xl flex-row items-center justify-center border border-primary/10 shadow-sm mb-4">
                  <ActivityIndicator color={themePrimary} size="small" />
                  <Text className="text-primary font-bold text-sm ml-3 tracking-wide">Running Intelligence Extraction Node...</Text>
                </View>
              )}

              {ocrText && (
                <View className="bg-card p-5 rounded-3xl border border-border/80 shadow-sm">
                  <Text className="text-foreground font-bold mb-3 tracking-wide text-md">Parsed Content Stream</Text>
                  <TextInput
                    value={ocrText}
                    multiline
                    editable={false}
                    className="text-muted-foreground text-xs leading-6 bg-muted/30 p-4 rounded-2xl border border-border/40 font-mono"
                  />
                  <TouchableOpacity
                    className="mt-4 flex-row items-center bg-primary/10 p-3 rounded-xl border border-primary/20 self-start active:opacity-80"
                    onPress={async () => {
                      await Clipboard.setStringAsync(refNo ?? '');
                      setCopied(true);
                    }}
                  >
                    <Ionicons name="copy-outline" size={16} color={themePrimary} />
                    <Text className="text-primary font-bold text-sm ml-2 tracking-wide">
                      {copied ? 'Payload Cached!' : 'Copy Reference'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* Error & Resolution Modals */}
      <StatusModal
        {...modal}
        onClose={() => {
          setModal((p) => ({ ...p, visible: false }));
          if (modal.type === 'success' && verifiedId) {
            router.dismissAll();
            router.push(`/verification/${verifiedId}` as any);
          } else if (modal.isVerificationFailure && referenceId) {
            Clipboard.setStringAsync(referenceId);
            router.replace('/(tabs)/verify/manual');
          }
        }}
      />
    </View>
  );
}