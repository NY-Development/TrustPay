import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { Image } from '@/components/ui/expo-image';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useVerifyManual } from '@/src/hooks/useVerification';
import { StatusModal } from '@/src/components/StatusModal';

import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { extractText } from '@/src/ai/ocr-processor';
import { useAI } from '@/src/ai/AIProvider';
import { AI_MODELS, isDownloaded } from '@/src/ai/model-download-manager';
import { useGlobalDownload } from '@/src/context/DownloadContext';
import { normalizeVerificationResponse } from '@/src/mappers/verification.mapper';
import { detectProvider } from '@/src/utils/provider-detector';
import type { AIModelId } from '@/src/ai/ai-types';

const MODEL_STORAGE_KEY = 'trustpay_selected_ai_model';

type AppPhase =
  | 'checking'
  | 'selecting'
  | 'downloading'
  | 'ready';

export default function OcrVerification() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { organizer, status: aiStatus } = useAI();
  const { downloadingModelId, progress: dlProgress, startGlobalDownload } = useGlobalDownload();

  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [verifiedId, setVerifiedId] = useState<string | null>(null);

  // Model lifecycle
  const [phase, setPhase] = useState<AppPhase>('checking');
  const [selectedModel, setSelectedModel] = useState<AIModelId | null>(null);

  // reference no. from AI
  const [refNo, setRefNo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        console.warn('[OCR Storage Load Error Handled]', err);
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
    } catch (err: any) {
      console.error('[OCR Init Error Processed Gracefully]', err);
      setPhase('selecting');
    }
  };

  const handleSelectModel = async (modelId: AIModelId) => {
    setSelectedModel(modelId);
    await initializeModel(modelId);
  };

  const handleVerification = (ai: any) => {
    const extractedRef =
      ai?.referenceNumber ||
      ai?.transactionNumber ||
      ai?.receiptNumber ||
      null;

    setRefNo(extractedRef);

    if (!extractedRef) {
      setScanning(false);
      setModal({
        visible: true,
        type: 'error',
        title: 'Reference Missing',
        message: 'Local AI was unable to parse a valid reference number.',
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
          setScanning(false);
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
            isVerificationFailure: false,
          });
        },
        onError: (err : any) => {
          setScanning(false);
          setModal({
            visible: true,
            type: 'error',
            title: 'Verification Failed',
            message: err.response?.data?.message || `Could not verify transaction: ${extractedRef}.\n\nWould you like to copy this reference number and verify it manually?`,
            isVerificationFailure: true,
          });
        },
      }
    );
  };

  // From Camera capture
  const captureImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setModal({
          visible: true,
          type: 'error',
          title: 'Permission Denied',
          message: 'Camera permission is required to capture receipts.',
          isVerificationFailure: false,
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);
        await processImage(uri);
      }
    } catch (err: any) {
      console.warn('[Camera Capture Error Processed]', err);
      setModal({
        visible: true,
        type: 'error',
        title: 'Camera Error',
        message: err.message || 'Could not launch device camera.',
        isVerificationFailure: false,
      });
    }
  };


  // From Gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      await processImage(uri);
    }
  };

  const processImage = async (uri: string) => {
    setScanning(true);
    try {
      const rawText = await extractText(uri);
      setOcrText(rawText);

      // Run extraction using AIOrganizer (automatically runs heuristics fallback if models not loaded)
      const extracted = await organizer.extractReceiptData(rawText);
      handleVerification(extracted);
    } catch (err: any) {
      setScanning(false);
      setModal({ visible: true, type: 'error', title: 'OCR Failed', message: err.message, isVerificationFailure: false });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // ──────────── MODEL SELECTION UI ────────────
  if (phase === 'checking' || phase === 'selecting') {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1 justify-center px-6">
          <View className="pt-8 flex-row items-center mb-8 absolute top-8 left-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold ml-4">OCR Scan</Text>
          </View>

          {phase === 'checking' ? (
            <ActivityIndicator color={themePrimary} size="large" />
          ) : (
            <View className="bg-card border border-border rounded-[32px] p-6 shadow-xl mt-12">
              <View className="items-center mb-6">
                <View className="bg-primary/10 p-4 rounded-full mb-4">
                  <Ionicons name="sparkles" size={36} color={themePrimary} />
                </View>
                <Text className="text-foreground text-xl font-bold text-center">Choose Your AI Model</Text>
                <Text className="text-muted-foreground text-center text-sm mt-2 leading-5">
                  The chosen core will download locally to your device storage layout for complete 100% offline parsing.
                </Text>
              </View>

              {AI_MODELS.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => handleSelectModel(model.id)}
                  className="border border-border bg-muted/30 rounded-2xl p-4 mb-3 active:bg-muted/60"
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-foreground text-base font-bold">{model.label}</Text>
                    <View className="bg-primary/20 px-2 py-0.5 rounded-full">
                      <Text className="text-primary text-xs font-semibold">{model.size}</Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground text-xs leading-4">{model.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SafeAreaView>
      </View>
    );
  }

  // ──────────── DOWNLOADING WEIGHTS UI ────────────
  if (phase === 'downloading') {
    const activeModel = AI_MODELS.find(m => m.id === selectedModel);
    const pct = dlProgress ? (dlProgress.percent * 100).toFixed(0) : '0';
    const dlInfo = dlProgress
      ? `${formatBytes(dlProgress.downloaded)} / ${formatBytes(dlProgress.total)}`
      : 'Preparing download pipeline...';

    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1 justify-center px-6">
          <View className="pt-8 flex-row items-center mb-8 absolute top-8 left-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold ml-4">OCR Scan</Text>
          </View>

          <View className="bg-card border border-border rounded-[32px] p-8 items-center shadow-xl">
            <View className="bg-primary/10 p-5 rounded-full mb-6">
              <Ionicons name="cloud-download-outline" size={48} color={themePrimary} />
            </View>
            <Text className="text-foreground text-2xl font-bold text-center mb-2">
              Downloading {activeModel?.label}
            </Text>
            <Text className="text-muted-foreground text-center text-sm leading-6 mb-6">
              Fetching and writing localized configuration layers. This continues safely in the background if you exit.
            </Text>

            <View className="w-full">
              <Text className="text-muted-foreground text-center text-xs mb-2 truncate">
                {dlProgress?.phase === 'preparing' ? 'Connecting to core storage hubs...' : dlProgress?.file || 'Connecting...'}
              </Text>
              <View className="w-full bg-muted rounded-full h-3 overflow-hidden mb-2">
                <View className="bg-primary h-full rounded-full" style={{ width: `${pct}%` as any }} />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground text-xs">{dlInfo}</Text>
                <Text className="text-primary font-bold text-sm">{pct}%</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────────── MAIN SCANNER VIEW (ready) ────────────
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">

        {/* HEADER */}
        <View className="pt-8 px-6 flex-row items-center mb-4 justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold ml-4">OCR Scan</Text>
          </View>
          <TouchableOpacity
            onPress={() => setPhase('selecting')}
            className="w-10 h-10 bg-muted/65 rounded-xl items-center justify-center border border-border/80 active:scale-95"
          >
            <Ionicons name="settings-outline" size={18} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          className="flex px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!image ? (
            <View className="flex-row gap-4 items-center justify-between">
              <TouchableOpacity
                onPress={pickImage}
                className="flex-1 h-44 bg-card border border-border rounded-3xl items-center justify-center active:bg-muted/30"
              >
                <View className="bg-primary/10 p-3 rounded-full mb-3">
                  <Ionicons name="cloud-upload-outline" size={32} color={themePrimary} />
                </View>
                <Text className="text-foreground text-sm font-bold text-center">Upload Receipt</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={captureImage}
                className="flex-1 h-44 bg-card border border-border rounded-3xl items-center justify-center active:bg-muted/30"
              >
                <View className="bg-primary/10 p-3 rounded-full mb-3">
                  <Ionicons name="camera-outline" size={32} color={themePrimary} />
                </View>
                <Text className="text-foreground text-sm font-bold text-center">Capture Receipt</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Image source={{ uri: image }} className="h-96 rounded-3xl mb-4" />
              {scanning && (
                <View className="bg-primary/5 p-4 rounded-xl flex-row items-center justify-center border border-primary/10 mb-4">
                  <ActivityIndicator color={themePrimary} />
                  <Text className="text-primary font-bold text-sm ml-3">Running Intelligent Extraction Node...</Text>
                </View>
              )}

              {ocrText && (
                <View className="bg-card p-4 rounded-2xl mt-4">
                  <Text className="text-foreground font-bold mb-2">Extracted Text</Text>
                  <TextInput value={ocrText} multiline editable={false} className="text-muted-foreground text-sm font-mono" />
                  <TouchableOpacity
                    onPress={async () => {
                      await Clipboard.setStringAsync(refNo ?? '');
                      setCopied(true);
                    }}
                    className="mt-4 flex-row items-center bg-primary/15 px-3 py-2 rounded-lg self-start active:opacity-85"
                  >
                    <Ionicons name="copy-outline" size={16} color={themePrimary} />
                    <Text className="text-primary font-extrabold text-xs ml-2 tracking-wide">
                      {copied ? `${refNo ?? ''} Copied` : 'Copy Reference'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* MODAL */}
        <StatusModal
          {...modal}
          onClose={async () => {
            setModal((p) => ({ ...p, visible: false }));
            if (modal.type === 'success' && verifiedId) {
              router.push(`/verification/${verifiedId}` as any);
            } else if (modal.isVerificationFailure && referenceId) {
              await Clipboard.setStringAsync(referenceId);
              router.replace('/(tabs)/verify/manual');
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}