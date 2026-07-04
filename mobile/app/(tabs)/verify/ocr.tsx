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
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { StatusModal } from '@/src/components/StatusModal';

import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { runOCR } from '@/src/ocr/ocr-processor';
import { organizeReceiptData } from '@/src/ocr/ai-organizer';

export default function OcrVerification() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const [image, setImage] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [ocrText, setOcrText] = React.useState<string | null>(null);
  const [referenceId, setReferenceId] = React.useState<string | null>(null);

  const [copied, setCopied] = React.useState(false);

  const [modal, setModal] = React.useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  const verifyManualMutation = useVerifyManual();
  const { data: history } = useVerificationHistory();

  const filteredHistory =
    referenceId && history?.data
      ? history.data.filter(
          (item: any) =>
            item.transactionId?.toLowerCase().includes(referenceId.toLowerCase()) ||
            item.referenceNumber?.toLowerCase().includes(referenceId.toLowerCase())
        )
      : [];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
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
    setOcrText(null);
    setReferenceId(null);

    try {
      // 1. OCR
      const ocr = await runOCR(uri);
      const rawText = ocr.text || '';

      setOcrText(rawText);

      if (!rawText.trim()) {
        throw new Error('No text detected');
      }

      // 2. AI extraction
      const ai = await organizeReceiptData(rawText);

      const extractedRef =
        ai?.referenceNumber ||
        ai?.transactionNumber ||
        ai?.receiptNumber ||
        null;

      if (!extractedRef) {
        throw new Error('No transaction reference found');
      }

      setReferenceId(extractedRef);

      // 3. Verify backend
      verifyManualMutation.mutate(
        { reference: extractedRef },
        {
          onSuccess: (res: any) => {
            setScanning(false);
            setModal({
              visible: true,
              type: res.success ? 'success' : 'error',
              title: res.success ? 'Verified' : 'Failed',
              message: res.message || 'Verification complete',
            });
          },
          onError: (err: any) => {
            setScanning(false);
            setModal({
              visible: true,
              type: 'error',
              title: 'Verification Error',
              message:
                err?.response?.data?.message ||
                'Could not verify transaction',
            });
          },
        }
      );
    } catch (err: any) {
      console.error('[OCR ERROR]', err);

      setScanning(false);

      setModal({
        visible: true,
        type: 'error',
        title: 'OCR Failed',
        message: err.message || 'Could not process image',
      });
    }
  };

  const copyText = async () => {
    if (ocrText) {
      await Clipboard.setStringAsync(ocrText);
      setCopied(true);
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
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={themePrimary}
              />
              <Text className="text-foreground mt-4 font-bold">
                Upload Receipt
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <Image
                source={{ uri: image }}
                className="h-96 rounded-3xl mb-4"
              />

              {scanning && (
                <ActivityIndicator color={themePrimary} size="large" />
              )}

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

                  <TouchableOpacity onPress={copyText}>
                    <Text className="text-primary mt-2">
                      {copied ? 'Copied' : 'Copy Text'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <StatusModal
          {...modal}
          onClose={() => setModal((p) => ({ ...p, visible: false }))}
        />
      </SafeAreaView>
    </View>
  );
}