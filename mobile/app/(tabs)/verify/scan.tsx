import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
  StyleSheet,
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

import { runOCR } from '@/src/ocr/ocr-processor';
import { runHeuristics } from '@/src/ocr/ai-organizer';
import { normalizeVerificationResponse } from '@/src/mappers/verification.mapper';
import { detectProvider } from '@/src/utils/provider-detector';
import { AIOrganizer, AIOrganizerHandle, AI_MODELS } from '@/src/ocr/AIOrganizer';
import {
  AIModelId,
  isModelDownloaded,
  downloadModel,
  getModelLocalPath,
  DownloadProgress,
} from '@/src/ocr/model-download-manager';
import { startModelServer, stopModelServer } from '@/src/ocr/local-model-server';

const MODEL_STORAGE_KEY = 'trustpay_selected_ai_model';

type AppPhase = 'checking' | 'selecting' | 'downloading' | 'starting_server' | 'compiling' | 'ready';

export default function UnifiedScanner() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const cameraRef = useRef<any>(null);
  const aiRef = useRef<AIOrganizerHandle>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Processing states
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [verifiedId, setVerifiedId] = useState<string | null>(null);
  const [refNo, setRefNo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Local AI Model Lifecycle States
  const [phase, setPhase] = useState<AppPhase>('checking');
  const [selectedModel, setSelectedModel] = useState<AIModelId | null>(null);
  const [localBaseUrl, setLocalBaseUrl] = useState<string | null>(null);
  const [useWebViewAi, setUseWebViewAi] = useState(true);
  const [dlProgress, setDlProgress] = useState<DownloadProgress | null>(null);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStatus, setCompileStatus] = useState('');

  const [modal, setModal] = useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
    isVerificationFailure: false,
  });

  const verifyManualMutation = useVerifyManual();

  // --- Auto-load or pick target model on mount ---
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(MODEL_STORAGE_KEY);
        if (saved) {
          setSelectedModel(saved as AIModelId);
          await initializeModel(saved as AIModelId);
        } else {
          setPhase('selecting');
        }
      } catch {
        setPhase('selecting');
      }
    };
    load();

    return () => {
      stopModelServer().catch(() => {});
    };
  }, []);

  const initializeModel = async (modelId: AIModelId) => {
    try {
      const alreadyDownloaded = await isModelDownloaded(modelId);
      if (!alreadyDownloaded) {
        setPhase('downloading');
        await downloadModel(modelId, (progress) => {
          setDlProgress(progress);
        });
      }

      setPhase('starting_server');
      const modelPath = getModelLocalPath(modelId);
      const serverUrl = await startModelServer(modelPath);
      setLocalBaseUrl(serverUrl);

      setPhase('compiling');
    } catch (err) {
      console.error('[Scan Init Error]', err);
      setUseWebViewAi(false);
      setPhase('ready');
    }
  };

  const handleSelectModel = async (modelId: AIModelId) => {
    await AsyncStorage.setItem(MODEL_STORAGE_KEY, modelId);
    setSelectedModel(modelId);
    await initializeModel(modelId);
  };

  const handleCompileProgress = (progress: number, text: string) => {
    setCompileProgress(progress);
    setCompileStatus(text);
  };

  const handleReady = () => {
    setPhase('ready');
  };

  const handleError = (message: string) => {
    console.warn("[AI WebView Error]", message);
    setUseWebViewAi(false);
    setPhase('ready');
  };

  // --- Process raw data through Core verification endpoints ---
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
        onError: () => {
          setProcessing(false);
          setModal({
            visible: true,
            type: 'error',
            title: 'Verification Failed',
            message: `Could not verify transaction reference: ${extractedRef}.\n\nWould you like to try manual confirmation?`,
            isVerificationFailure: true,
          });
        },
      }
    );
  };

  // --- Path A: QR Code Detected ---
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (processing || imageUri || !data) return;
    setProcessing(true);

    let reference = data;
    if (data.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(data);
        reference = parsed.reference || parsed.txnId || parsed.transactionId || data;
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
      }
    );
  };

  // --- Path B: Paper Snapshot Snapshot Trigger Button ---
  const takeReceiptSnapshot = async () => {
    if (!cameraRef.current || processing) return;
    
    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (photo?.uri) {
        setImageUri(photo.uri);
        
        // Feed frame into native image parser
        const ocr = await runOCR(photo.uri);
        const rawText = ocr.text || '';
        setOcrText(rawText);

        if (useWebViewAi) {
          aiRef.current?.processText(rawText);
        } else {
          const ai = runHeuristics(rawText);
          handleVerification(ai);
        }
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

  // --- Global Parser Callback Hooks ---
  const handleResult = (resultText: string) => {
    try {
      const start = resultText.indexOf('{');
      const end = resultText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const jsonStr = resultText.slice(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        handleVerification({
          bank: parsed.bank || 'unknown',
          referenceNumber: parsed.referenceNumber || parsed.transactionNumber || null,
          transactionNumber: parsed.transactionNumber || parsed.referenceNumber || null,
          amount: parsed.amount ? parseFloat(parsed.amount) : null,
          currency: parsed.currency || 'ETB',
        });
      } else {
        throw new Error("Formatting variance detected");
      }
    } catch {
      const fallback = runHeuristics(ocrText || '');
      handleVerification(fallback);
    }
  };

  // --- Initial Setup/Loading Interface Render Blocks ---
  if (phase === 'checking' || phase === 'selecting') {
    return (
      <View className="flex-1 bg-background justify-center px-6">
        {phase === 'checking' ? (
          <ActivityIndicator color={themePrimary} size="large" />
        ) : (
          <View className="bg-card border border-border rounded-[32px] p-6 shadow-xl">
            <View className="items-center mb-6">
              <View className="bg-primary/10 p-4 rounded-full mb-4">
                <Ionicons name="sparkles" size={36} color={themePrimary} />
              </View>
              <Text className="text-foreground text-xl font-bold text-center">Select Intelligence Core</Text>
            </View>
            {AI_MODELS.map((model) => (
              <TouchableOpacity
                key={model.id}
                onPress={() => handleSelectModel(model.id)}
                className="border border-border bg-muted/30 rounded-2xl p-4 mb-3"
              >
                <Text className="text-foreground text-base font-bold">{model.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (phase === 'downloading' || phase === 'starting_server' || phase === 'compiling') {
    return (
      <View className="flex-1 bg-background justify-center px-6">
        <View className="bg-card border border-border rounded-[32px] p-8 items-center shadow-xl">
          <ActivityIndicator color={themePrimary} size="large" />
          <Text className="text-foreground text-lg font-bold mt-4">Assembling Offline Engine...</Text>
        </View>
        {selectedModel && (
          <AIOrganizer
            ref={aiRef}
            modelId={selectedModel}
            localBaseUrl={localBaseUrl || undefined}
            onProgress={handleCompileProgress}
            onReady={handleReady}
            onResult={handleResult}
            onError={handleError}
          />
        )}
      </View>
    );
  }

  if (!cameraPermission || !cameraPermission.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="camera-outline" size={64} color={themePrimary} />
        <Text className="text-foreground text-xl font-bold mt-6 text-center">Camera Access Required</Text>
        <TouchableOpacity onPress={requestCameraPermission} className="bg-primary px-10 h-14 rounded-2xl mt-6 items-center justify-center">
          <Text className="text-primary-foreground font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        
        {/* Universal Sticky Top Header Bar */}
        <View className="pt-2 pb-4 px-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold ml-4">Universal Scanner</Text>
          </View>
        </View>

        {/* Unified Display Frame */}
        <View className="flex-1 px-6 pb-4">
          {!imageUri ? (
            <View className="flex-1 rounded-[36px] overflow-hidden relative border border-border shadow-md">
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={processing ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
              
              {/* Isolated Absolute Interface View Overlay Layers */}
              <View style={StyleSheet.absoluteFillObject} className="justify-between items-center bg-black/20 p-6">
                <View className="items-center mt-4 bg-black/40 px-4 py-2 rounded-full">
                  <Text className="text-white text-xs font-semibold tracking-wide">
                    Holds QR inside frame or Point & Tap Snapshot
                  </Text>
                </View>

                {/* Target Frame Alignment Box UI */}
                <View className="w-64 h-64 border-2 border-dashed border-white/80 rounded-[40px] items-center justify-center">
                  {processing && <ActivityIndicator size="large" color="#ffffff" />}
                </View>

                {/* Single Primary Capture Control Handle Bar */}
                <TouchableOpacity
                  onPress={takeReceiptSnapshot}
                  disabled={processing}
                  className="w-20 h-20 bg-white border-4 border-slate-300 rounded-full items-center justify-center shadow-lg active:scale-95"
                >
                  <Ionicons name="camera" size={32} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Analysis Frozen State Display Board */
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Image source={{ uri: imageUri }} className="h-72 rounded-[28px] mb-4" />
              
              <TouchableOpacity 
                onPress={() => { setImageUri(null); setOcrText(null); setProcessing(false); }}
                className="bg-muted h-12 rounded-xl items-center justify-center flex-row mb-4 border border-border"
              >
                <Ionicons name="refresh" size={16} color={isDark ? 'white' : 'black'} />
                <Text className="text-foreground font-semibold ml-2">Reset Camera Lens</Text>
              </TouchableOpacity>

              {processing && (
                <View className="bg-card p-4 rounded-2xl flex-row items-center justify-center border border-border shadow-sm mb-4">
                  <ActivityIndicator color={themePrimary} />
                  <Text className="text-foreground font-medium ml-3">Running Intelligent Content Extractors...</Text>
                </View>
              )}

              {ocrText && (
                <View className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <Text className="text-foreground font-bold mb-2">Extracted Document Text</Text>
                  <TextInput value={ocrText} multiline editable={false} className="text-muted-foreground text-xs leading-5 bg-muted/40 p-3 rounded-xl" />
                  <TouchableOpacity
                    className="mt-4 flex-row items-center"
                    onPress={async () => {
                      await Clipboard.setStringAsync(refNo ?? '');
                      setCopied(true);
                    }}
                  >
                    <Ionicons name="copy-outline" size={16} color={themePrimary} />
                    <Text className="text-primary font-bold text-sm ml-2">{copied ? 'Reference Copied!' : 'Copy Parsed ID'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Global Feedback Handling Notification Modal Sheets */}
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
      </SafeAreaView>

      {/* Background AI Inference WebGPU Bridge Components */}
      {selectedModel && (
        <AIOrganizer
          ref={aiRef}
          modelId={selectedModel}
          localBaseUrl={localBaseUrl || undefined}
          onProgress={handleCompileProgress}
          onReady={handleReady}
          onResult={handleResult}
          onError={handleError}
        />
      )}
    </View>
  );
}