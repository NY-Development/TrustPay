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
import { organizeReceiptData } from '@/src/ocr/ai-organizer';
import { normalizeVerificationResponse } from '@/src/mappers/verification.mapper';
import { detectProvider } from '@/src/utils/provider-detector';

export default function OcrVerification() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const [image, setImage] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [ocrText, setOcrText] = React.useState<string | null>(null);
  const [referenceId, setReferenceId] = React.useState<string | null>(null);
  const [verifiedId, setVerifiedId] = React.useState<string | null>(null);

  const [copied, setCopied] = React.useState(false);

  const [modal, setModal] = React.useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  const verifyManualMutation = useVerifyManual();

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

      const ai = await organizeReceiptData(rawText);

      const extractedRef =
        ai?.referenceNumber ||
        ai?.transactionNumber ||
        ai?.receiptNumber ||
        null;

      if (!extractedRef) throw new Error('Reference not found');

      setReferenceId(extractedRef);

      const detected = ai?.provider || detectProvider(extractedRef);

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
              message: 'Could not verify transaction',
            });
          },
        }
      );
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

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <View className="pt-8 px-6 flex-row items-center mb-8">
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

        <ScrollView className="px-6">
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

        <StatusModal
          {...modal}
          onClose={() => {
            setModal((p) => ({ ...p, visible: false }));
            if (modal.type === 'success' && verifiedId) {
              router.replace(`/verification/${verifiedId}` as any);
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}