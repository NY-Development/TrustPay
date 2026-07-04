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
import { AIOrganizer, AIOrganizerHandle } from '@/src/ocr/AIOrganizer';

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

  const [modelReady, setModelReady] = React.useState(false);
  const [modelProgress, setModelProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState('Initializing local WebGPU engine...');
  const [useWebViewAi, setUseWebViewAi] = React.useState(true);

  const [copied, setCopied] = React.useState(false);

  const [modal, setModal] = React.useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  const verifyManualMutation = useVerifyManual();

  const handleProgress = (progress: number, text: string) => {
    setModelProgress(progress);
    setStatusText(text);
  };

  const handleReady = () => {
    setModelReady(true);
    setStatusText('Local AI model ready.');
  };

  const handleError = (message: string) => {
    console.warn("[Gemma WebView Error]", message);
    // WebGL/GPU not supported or download crashed, fallback to heuristics immediately
    setUseWebViewAi(false);
    setModelReady(true); // Heuristics require no loading, so we are ready
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
      console.warn("[Gemma WebGPU Parse Error]", err);
      // Fallback to heuristics if webview returned garbage
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

    if (!extractedRef) {
      setScanning(false);
      setModal({
        visible: true,
        type: 'error',
        title: 'Reference Missing',
        message: 'Local AI was unable to parse a valid reference number.'
      });
      return;
    }

    setReferenceId(extractedRef);
    const detected = ai?.bank || detectProvider(extractedRef);

    verifyManualMutation.mutate(
      {
        reference: extractedRef,
        provider: detected,
      },
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
          });
        },
        onError: () => {
          setScanning(false);
          setModal({
            visible: true,
            type: 'error',
            title: 'Verification Failed',
            message: `Could not verify transaction: ${extractedRef}`,
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
      setModal({
        visible: true,
        type: 'error',
        title: 'OCR Failed',
        message: err.message,
      });
    }
  };

  if (!modelReady) {
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
            <Text className="text-foreground text-2xl font-bold text-center mb-3">Initializing Local AI</Text>
            <Text className="text-muted-foreground text-center text-sm leading-6 mb-8">
              TrustPay is spinning up a secure browser sandboxed Gemma 2B model using WebGPU graphics acceleration layers.
            </Text>

            <View className="w-full">
              <Text className="text-muted-foreground text-center text-xs mb-2">{statusText}</Text>
              <View className="w-full bg-muted rounded-full h-3 overflow-hidden mb-2">
                <View className="bg-primary h-full rounded-full" style={{ width: `${modelProgress * 100}%` }} />
              </View>
              <Text className="text-primary text-center font-bold">{(modelProgress * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </SafeAreaView>

        <AIOrganizer
          ref={aiRef}
          onProgress={handleProgress}
          onReady={handleReady}
          onResult={handleResult}
          onError={handleError}
        />

        <StatusModal
          {...modal}
          onClose={() => setModal((p) => ({ ...p, visible: false }))}
        />
      </View>
    );
  }

 return (
  <View className="flex-1 bg-background">
    <SafeAreaView className="flex-1">
      
      {/* HEADER (fixed, NOT scrollable) */}
      <View className="pt-8 px-6 flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>

        <Text className="text-foreground text-2xl font-bold ml-4">
          OCR Scan
        </Text>
      </View>

      {/* SCROLLABLE CONTENT ONLY */}
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
            <Text className="text-foreground mt-4 font-bold">
              Upload Receipt
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <Image source={{ uri: image }} className="h-96 rounded-3xl mb-4" />

            {scanning && <ActivityIndicator color={themePrimary} />}

            {ocrText && (
              <View className="bg-card p-4 rounded-2xl mt-4">
                <Text className="text-foreground font-bold mb-2">
                  Extracted Text
                </Text>

                <TextInput
                  value={ocrText}
                  multiline
                  editable={false}
                  className="text-muted-foreground"
                />

                <TouchableOpacity
                  onPress={async () => {
                    await Clipboard.setStringAsync(ocrText);
                    setCopied(true);
                  }}
                >
                  <Text className="text-primary mt-2">
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* MODAL OUTSIDE SCROLL */}
      <StatusModal
        {...modal}
        onClose={() => {
          setModal((p) => ({ ...p, visible: false }));
          if (modal.type === 'success' && verifiedId) {
            router.push(`/verification/${verifiedId}` as any);
          }
        }}
      />

    </SafeAreaView>

    <AIOrganizer
      ref={aiRef}
      onProgress={handleProgress}
      onReady={handleReady}
      onResult={handleResult}
      onError={handleError}
    />
  </View>
);
}