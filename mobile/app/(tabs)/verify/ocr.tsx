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
  getModelLocalPath,
  deleteModel,
} from '@/src/ocr/model-download-manager';
import { startModelServer, stopModelServer } from '@/src/ocr/local-model-server';
import { useGlobalDownload } from '@/src/context/DownloadContext'; // 👈 IMPORTED

const MODEL_STORAGE_KEY = 'trustpay_selected_ai_model';

type AppPhase =
  | 'checking'      
  | 'selecting'     
  | 'downloading'   
  | 'starting_server' 
  | 'compiling'     
  | 'ready';        

export default function OcrVerification() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const aiRef = React.useRef<AIOrganizerHandle>(null);
  const { downloadingModelId, progress: dlProgress, startGlobalDownload } = useGlobalDownload(); // 👈 GLOBAL HOOK CONSUMED

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

  // reference no. from AI
  const [refNo, setRefNo] = React.useState<string | null>(null);

  // WebLLM compile progress
  const [compileProgress, setCompileProgress] = React.useState(0);
  const [compileStatus, setCompileStatus] = React.useState('');

  const [copied, setCopied] = React.useState(false);

  const [modal, setModal] = React.useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
    isVerificationFailure: false, 
  });

  const verifyManualMutation = useVerifyManual();

  // ─── Direct Background Download Interception Loop ────────────────────────────
  React.useEffect(() => {
    if (downloadingModelId) {
      setSelectedModel(downloadingModelId);
      setPhase('downloading');
    }
  }, [downloadingModelId]);

  // ─── On mount: check saved model with crash protection ────────────────────────
  React.useEffect(() => {
    const load = async () => {
      try {
        if (downloadingModelId) return; // Background provider has higher priority

        const saved = await AsyncStorage.getItem(MODEL_STORAGE_KEY);
        if (saved) {
          setSelectedModel(saved as AIModelId);
          await initializeModel(saved as AIModelId);
        } else {
          setPhase('selecting');
        }
      } catch (err) {
        console.warn('[OCR Storage Load Error Handled]', err);
        setPhase('selecting');
      }
    };
    load();

    return () => {
      stopModelServer().catch(() => {});
    };
  }, []);

  // ─── Keep checking background state updates to fire up engine upon download complete ────
  React.useEffect(() => {
    if (phase === 'downloading' && !downloadingModelId && selectedModel) {
      // Background operation finished successfully
      verifyAndBootServer(selectedModel);
    }
  }, [downloadingModelId, phase, selectedModel]);

  const verifyAndBootServer = async (modelId: AIModelId) => {
    try {
      setPhase('starting_server');
      const modelPath = getModelLocalPath(modelId);
      const serverUrl = await startModelServer(modelPath);
      setLocalBaseUrl(serverUrl);
      setPhase('compiling');
    } catch (err) {
      handleGracefulFailure(modelId, err);
    }
  };

  const handleGracefulFailure = async (modelId: AIModelId, err: any) => {
    console.error('[OCR Init Error Processed Gracefully]', err);
    try {
      await AsyncStorage.removeItem(MODEL_STORAGE_KEY);
      await deleteModel(modelId);
    } catch (cleanupErr) {
      console.warn('Failed clearing model files during fallback sequence', cleanupErr);
    }
    setSelectedModel(null);
    setPhase('selecting');
  };

  const initializeModel = async (modelId: AIModelId) => {
    try {
      const alreadyDownloaded = await isModelDownloaded(modelId);

      if (!alreadyDownloaded) {
        setPhase('downloading');
        await startGlobalDownload(modelId); // 👈 GLOBAL TASK LAUNCHER
        return; // UI now monitors context updates instead
      }

      await verifyAndBootServer(modelId);
    } catch (err: any) {
      await handleGracefulFailure(modelId, err);
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
                {dlProgress?.phase === 'config' ? 'Fetching essential config headers...' : dlProgress?.file || 'Connecting...'}
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

  // ──────────── STARTING SERVER UI ────────────
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
              Spawning micro HTTP node context to dispatch structural files inside WebGPU architecture safely...
            </Text>
            <ActivityIndicator color={themePrimary} size="large" className="mt-6" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────────── COMPILING UI ────────────
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
              Assembling structural logic graphs directly onto device hardware accelerators...
            </Text>

            <View className="w-full">
              <Text className="text-muted-foreground text-center text-xs mb-2">{compileStatus || 'Linking WebGPU...'}</Text>
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
              <Text className="text-muted-foreground text-xs underline">Change Chosen Engine</Text>
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
                  <TextInput value={ocrText} multiline editable={false} className="text-muted-foreground text-sm" />
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