import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

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

type AppPhase =
  | 'checking'      // checking AsyncStorage for saved model
  | 'selecting'     // user picks a model
  | 'downloading'   // downloading weight shards natively
  | 'starting_server' // spinning up local HTTP server
  | 'compiling'     // WebLLM compiling in WebView
  | 'ready';        // model ready for inference

export default function OcrVerification() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const aiRef = React.useRef<AIOrganizerHandle>(null);

  const [image, setImage] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [ocrText, setOcrText] = React.useState<string | null>(null);
  const [referenceId, setReferenceId] = React.useState<string | null>(null);
  const [verifiedId, setVerifiedId] = React.useState<string | null>(null);

  // Model lifecycle
  const [phase, setPhase] = React.useState<AppPhase>('checking');
  const [selectedModel, setSelectedModel] = React.useState<AIModelId | null>(null);
  const [localBaseUrl, setLocalBaseUrl] = React.useState<string | null>(null);
  const [useWebViewAi, setUseWebViewAi] = React.useState(true);

  // refrence no. from AI
  const [refNo, setRefNo] = React.useState<string | null>(null);

  // Download progress
  const [dlProgress, setDlProgress] = React.useState<DownloadProgress | null>(null);

  // WebLLM compile progress
  const [compileProgress, setCompileProgress] = React.useState(0);
  const [compileStatus, setCompileStatus] = React.useState('');

  const [copied, setCopied] = React.useState(false);

  const [modal, setModal] = React.useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
    isVerificationFailure: false, // Flag tracking verification errors
  });

  const verifyManualMutation = useVerifyManual();

  // ─── On mount: check saved model ────────────────────────
  React.useEffect(() => {
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

  // ─── Full initialization pipeline ──────────────────────
  const initializeModel = async (modelId: AIModelId) => {
    try {
      // Step 1: Check if already downloaded
      const alreadyDownloaded = await isModelDownloaded(modelId);

      if (!alreadyDownloaded) {
        // Step 2: Download model shards
        setPhase('downloading');
        await downloadModel(modelId, (progress) => {
          setDlProgress(progress);
        });
      }

      // Step 3: Start local HTTP server
      setPhase('starting_server');
      const modelPath = getModelLocalPath(modelId);
      const serverUrl = await startModelServer(modelPath);
      setLocalBaseUrl(serverUrl);

      // Step 4: Hand off to WebLLM for GPU compilation
      setPhase('compiling');
    } catch (err: any) {
      console.error('[OCR Init Error]', err);
      // Fallback to heuristics
      setUseWebViewAi(false);
      setPhase('ready');
    }
  };

  const handleSelectModel = async (modelId: AIModelId) => {
    await AsyncStorage.setItem(MODEL_STORAGE_KEY, modelId);
    setSelectedModel(modelId);
    await initializeModel(modelId);
  };

  // ─── WebLLM callbacks ──────────────────────────────────
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
          senderName: parsed.senderName || 'Customer Scan',
          receiverName: parsed.receiverName || 'Merchant Wallet',
        });
      } else {
        throw new Error("Invalid output format");
      }
    } catch (err) {
      console.warn("[AI Parse Error]", err);
      const fallback = runHeuristics(ocrText || '');
      handleVerification(fallback);
    }
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
        onError: () => {
          setScanning(false);
          setModal({
            visible: true,
            type: 'error',
            title: 'Verification Failed',
            message: `Could not verify transaction: ${extractedRef}.\n\nWould you like to copy this reference number and verify it manually?`,
            isVerificationFailure: true,
          });
        },
      }
    );
  };

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
      const ocr = await runOCR(uri);
      const rawText = ocr.text || '';
      setOcrText(rawText);

      if (useWebViewAi) {
        aiRef.current?.processText(rawText);
      } else {
        const ai = runHeuristics(rawText);
        handleVerification(ai);
      }
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

  // ──────────── MODEL SELECTION ────────────
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
            <View className="bg-card border border-border rounded-[32px] p-6 shadow-xl">
              <View className="items-center mb-6">
                <View className="bg-primary/10 p-4 rounded-full mb-4">
                  <Ionicons name="sparkles" size={36} color={themePrimary} />
                </View>
                <Text className="text-foreground text-xl font-bold text-center">Choose Your AI Model</Text>
                <Text className="text-muted-foreground text-center text-sm mt-2 leading-5">
                  The model will be downloaded permanently to your device for 100% offline operation.
                </Text>
              </View>

              {AI_MODELS.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => handleSelectModel(model.id)}
                  className="border border-border bg-muted/30 rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-foreground text-base font-bold">{model.label}</Text>
                    <View className="bg-muted px-2 py-0.5 rounded-full">
                      <Text className="text-muted-foreground text-xs font-semibold">{model.size}</Text>
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

  // ──────────── DOWNLOADING WEIGHTS ────────────
  if (phase === 'downloading') {
    const activeModel = AI_MODELS.find(m => m.id === selectedModel);
    const pct = dlProgress ? (dlProgress.percent * 100).toFixed(0) : '0';
    const dlInfo = dlProgress
      ? `${formatBytes(dlProgress.downloaded)} / ${formatBytes(dlProgress.total)}`
      : 'Preparing...';

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
              Saving model weights permanently to your device. This only happens once per model.
            </Text>

            <View className="w-full">
              <Text className="text-muted-foreground text-center text-xs mb-2">
                {dlProgress?.phase === 'config' ? 'Downloading config files...' : dlProgress?.file || 'Preparing...'}
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

  // ──────────── STARTING SERVER ────────────
  if (phase === 'starting_server') {
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
              <Ionicons name="server-outline" size={48} color={themePrimary} />
            </View>
            <Text className="text-foreground text-xl font-bold text-center mb-3">Starting Local Server</Text>
            <Text className="text-muted-foreground text-center text-sm leading-6">
              Setting up a secure local HTTP server to serve the model to the WebGPU engine...
            </Text>
            <ActivityIndicator color={themePrimary} size="large" className="mt-6" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────────── COMPILING (WebLLM) ────────────
  if (phase === 'compiling' && selectedModel) {
    const activeModel = AI_MODELS.find(m => m.id === selectedModel);

    return (
      <View className="flex-1 bg-background justify-between">
        <SafeAreaView className="flex-1 justify-center px-6">
          <View className="pt-8 flex-row items-center mb-8 absolute top-8 left-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold ml-4">OCR Scan</Text>
          </View>

          <View className="bg-card border border-border rounded-[32px] p-8 items-center shadow-xl">
            <View className="bg-primary/10 p-5 rounded-full mb-6">
              <Ionicons name="hardware-chip-outline" size={48} color={themePrimary} />
            </View>
            <Text className="text-foreground text-2xl font-bold text-center mb-2">
              Compiling {activeModel?.label}
            </Text>
            <Text className="text-muted-foreground text-center text-sm leading-6 mb-6">
              Loading cached weights from local storage into the WebGPU graphics pipeline...
            </Text>

            <View className="w-full">
              <Text className="text-muted-foreground text-center text-xs mb-2">{compileStatus || 'Initializing WebGPU...'}</Text>
              <View className="w-full bg-muted rounded-full h-3 overflow-hidden mb-2">
                <View className="bg-primary h-full rounded-full" style={{ width: `${compileProgress * 100}%` as any }} />
              </View>
              <Text className="text-primary text-center font-bold">{(compileProgress * 100).toFixed(0)}%</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setPhase('selecting');
                setCompileProgress(0);
                setCompileStatus('');
                stopModelServer().catch(() => {});
              }}
              className="mt-6 px-4 py-2"
            >
              <Text className="text-muted-foreground text-xs underline">Change Model</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <AIOrganizer
          ref={aiRef}
          modelId={selectedModel}
          localBaseUrl={localBaseUrl || undefined}
          onProgress={handleCompileProgress}
          onReady={handleReady}
          onResult={handleResult}
          onError={handleError}
        />

        <StatusModal
          {...modal}
          onClose={async () => {
            setModal((p) => ({ ...p, visible: false }));
            if (modal.isVerificationFailure && referenceId) {
              await Clipboard.setStringAsync(referenceId);
              router.replace('/(tabs)/verify/manual');
            }
          }}
        />
      </View>
    );
  }

  // ──────────── MAIN SCANNER VIEW (ready) ────────────
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        
        {/* HEADER */}
        <View className="pt-8 px-6 flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-foreground text-2xl font-bold ml-4">OCR Scan</Text>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!image ? (
            <TouchableOpacity
              onPress={pickImage}
              className="h-96 bg-card border border-border rounded-3xl items-center justify-center"
            >
              <Ionicons name="cloud-upload-outline" size={48} color={themePrimary} />
              <Text className="text-foreground mt-4 font-bold">Upload Receipt</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Image source={{ uri: image }} className="h-96 rounded-3xl mb-4" />
              {scanning && <ActivityIndicator color={themePrimary} />}

              {ocrText && (
                <View className="bg-card p-4 rounded-2xl mt-4">
                  <Text className="text-foreground font-bold mb-2">Extracted Text</Text>
                  <TextInput value={ocrText} multiline editable={false} className="text-muted-foreground" />
                  <TouchableOpacity
                    onPress={async () => {
                      await Clipboard.setStringAsync(refNo ?? '');
                      setCopied(true);
                    }}
                  >
                    <Text className="text-primary mt-2">{copied ? `${refNo ?? ''} Copied` : 'Copy'}</Text>
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