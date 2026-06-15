import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useVerifyOcr } from '../../../src/hooks/useVerification';
import { StatusModal } from '../../../src/components/StatusModal';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition";

export default function OcrVerification() {
  const [image, setImage] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const verifyOcrMutation = useVerifyOcr();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      handleProcessScreenshot(result.assets[0].uri);
    }
  };

  const handleProcessScreenshot = async (uri: string) => {
    setScanning(true);
    
    try {
      // 1. Perform local OCR using ML Kit (On-Device)
      const result = await recognizeText(uri);
      const rawText = result.text;

      if (!rawText) {
        throw new Error('No text detected in screenshot');
      }

      // 2. Send extracted raw text to backend for regex pattern matching
      verifyOcrMutation.mutate({ rawText }, {
        onSuccess: (res) => {
          setScanning(false);
          setModal({
            visible: true,
            type: res.success ? 'success' : 'error',
            title: res.success ? 'Verified' : 'Verification Failed',
            message: res.message || 'Payment successfully parsed and verified.'
          });
        },
        onError: (err: any) => {
          setScanning(false);
          setModal({
            visible: true,
            type: 'error',
            title: 'Processing Error',
            message: err.response?.data?.message || 'Verification service failed to identify payment patterns.'
          });
        }
      });
    } catch (err) {
      setScanning(false);
      setModal({
        visible: true,
        type: 'error',
        title: 'OCR Failed',
        message: 'Could not extract text from image. Please try another screenshot or enter manually.'
      });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        <View className="pt-8 px-6 flex-row items-center mb-8">
          <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold ml-4">Screenshot OCR</Text>
        </View>

        <View className="flex-1 px-6 justify-center">
          {!image ? (
            <TouchableOpacity 
              onPress={pickImage}
              className="w-full aspect-[3/4] bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-[40px] items-center justify-center"
            >
              <View className="w-24 h-24 rounded-full bg-[#00E5FF]/10 items-center justify-center mb-6">
                <Ionicons name="cloud-upload-outline" size={48} color="#00E5FF" />
              </View>
              <Text className="text-white text-xl font-bold">Select Screenshot</Text>
              <Text className="text-zinc-500 mt-2 text-center px-12">Upload the payment confirmation screen for instant verification.</Text>
            </TouchableOpacity>
          ) : (
            <View className="w-full aspect-[3/4] bg-zinc-900 rounded-[40px] overflow-hidden">
              <Image source={{ uri: image }} className="flex-1" resizeMode="cover" />
              {scanning && (
                <BlurView intensity={20} tint="dark" className="absolute inset-0 items-center justify-center">
                  <View className="bg-black/60 p-8 rounded-3xl items-center">
                    <ActivityIndicator size="large" color="#00E5FF" />
                    <Text className="text-white font-bold mt-4 text-lg">Scanning...</Text>
                    <Text className="text-zinc-400 mt-1">Locating transaction patterns</Text>
                  </View>
                </BlurView>
              )}
              {!scanning && (
                <TouchableOpacity 
                  onPress={() => setImage(null)}
                  className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/50 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View className="px-6 pb-12 pt-8">
          <TouchableOpacity 
            onPress={pickImage}
            disabled={scanning}
            className="bg-zinc-800 h-16 rounded-2xl items-center justify-center flex-row active:bg-zinc-700"
          >
            <Ionicons name="image" size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">Choose Different Image</Text>
          </TouchableOpacity>
        </View>

        <StatusModal 
          {...modal} 
          onClose={() => {
            setModal({ ...modal, visible: false });
            if (modal.type === 'success') router.replace('/(tabs)');
          }} 
        />
      </SafeAreaView>
    </View>
  );
}