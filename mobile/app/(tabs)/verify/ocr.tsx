import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView, TextInput, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useVerifyManual } from '../../../src/hooks/useVerification';
import { StatusModal } from '../../../src/components/StatusModal';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition";
import { useColorScheme } from 'nativewind';

export default function OcrVerification() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const [image, setImage] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [ocrTextFallback, setOcrTextFallback] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  
  const [modal, setModal] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const verifyManualMutation = useVerifyManual();

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
    setOcrTextFallback(null);
    setCopied(false);
    
    try {
      // 1. Perform local OCR using ML Kit (On-Device)
      const result = await recognizeText(uri);
      const rawText = result?.text || '';

      if (!rawText.trim()) {
        throw new Error('No text detected in screenshot. Please ensure it is a valid receipt image.');
      }

      // 2. OpenRouter API setup
      const apiKey = process.env.EXPO_PUBLIC_OPEN_ROUTER_API_KEY;
      if (!apiKey) {
        console.warn("OpenRouter API key missing. Falling back to manual text copy.");
        setOcrTextFallback(rawText);
        setScanning(false);
        setModal({
          visible: true,
          type: 'error',
          title: 'Config Needed',
          message: 'Public OpenRouter API key not configured. Showing extracted raw text instead.'
        });
        return;
      }

      // Call OpenRouter with Mistral-Nemo
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8081",
          "X-Title": "TrustPay Mobile"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-nemo", 
          messages: [
            { 
              role: "system", 
              content: `You are a highly precise Financial Data Extraction Engine for Ethiopian payment screenshots. 
Your goal is to parse raw OCR text and return a strict JSON object.

RULES:
1. RESPONSE FORMAT: Return ONLY a raw JSON object. NO markdown code blocks, NO backticks (\`\`\`), NO "Here's your JSON", NO explanations, NO introductory text.
2. If unable to extract a field, return null for it.

Required Fields:
- referenceId (string): The transaction reference number / transaction ID (e.g. FT23xyz, Ref... etc.).`
            },
            {
              role: "user",
              content: rawText
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter network response status: ${response.status}`);
      }

      const resJson = await response.json();
      const content = resJson?.choices?.[0]?.message?.content;
      console.log("[AI Organizer] Result:", content);

      let referenceId = null;
      if (content) {
        try {
          // clean any markdown wrappers just in case
          const cleanJson = content.trim().replace(/^```json|```$/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          referenceId = parsed?.referenceId;
        } catch (e) {
          const match = content.match(/"referenceId"\s*:\s*"([^"]+)"/);
          if (match) {
            referenceId = match[1];
          }
        }
      }

      if (!referenceId) {
        throw new Error('AI could not parse reference ID from OCR text.');
      }

      // 3. Make manual verify call using backend Verify.ET API
      verifyManualMutation.mutate({ reference: referenceId }, {
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
          setOcrTextFallback(rawText);
        }
      });

    } catch (err: any) {
      console.error("[OCR Process Error]", err);
      setScanning(false);

      // Local fallback OCR text extraction
      try {
        const result = await recognizeText(uri);
        if (result?.text) {
          setOcrTextFallback(result.text);
        }
      } catch (e) {}

      setModal({
        visible: true,
        type: 'error',
        title: 'OCR Scanning Failed',
        message: 'Could not extract transaction ID automatically. You can copy the raw text details and input manual fields.'
      });
    }
  };

  const copyToClipboard = () => {
    if (ocrTextFallback) {
      Clipboard.setString(ocrTextFallback);
      setCopied(true);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <View className="pt-8 px-6 flex-row items-center mb-8">
          <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full bg-muted items-center justify-center">
            <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-foreground text-2xl font-bold ml-4">Screenshot OCR</Text>
        </View>

        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {!image ? (
            <TouchableOpacity 
              onPress={pickImage}
              className="w-full aspect-[3/4] bg-card border-2 border-dashed border-border rounded-[40px] items-center justify-center"
            >
              <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
                <Ionicons name="cloud-upload-outline" size={48} color={themePrimary} />
              </View>
              <Text className="text-foreground text-xl font-bold">Select Screenshot</Text>
              <Text className="text-muted-foreground mt-2 text-center px-12">Upload the payment confirmation screen for instant verification.</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View className="w-full aspect-[3/4] bg-card rounded-[40px] overflow-hidden mb-6">
                <Image source={{ uri: image }} className="flex-1" resizeMode="cover" />
                {scanning && (
                  <BlurView intensity={20} tint={isDark ? "dark" : "light"} className="absolute inset-0 items-center justify-center">
                    <View className="bg-background/80 p-8 rounded-3xl items-center border border-border">
                      <ActivityIndicator size="large" color={themePrimary} />
                      <Text className="text-foreground font-bold mt-4 text-lg">AI Recognizing...</Text>
                      <Text className="text-muted-foreground mt-1">Parsing receipt reference data</Text>
                    </View>
                  </BlurView>
                )}
                {!scanning && (
                  <TouchableOpacity 
                    onPress={() => {
                      setImage(null);
                      setOcrTextFallback(null);
                    }}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/50 items-center justify-center"
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                )}
              </View>

              {ocrTextFallback && (
                <View className="bg-card border border-border rounded-3xl p-5 mb-6">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-foreground font-bold text-base">Raw Extracted Text</Text>
                    <TouchableOpacity 
                      onPress={copyToClipboard}
                      className="bg-primary/10 px-3 py-1.5 rounded-full flex-row items-center border border-primary/20"
                    >
                      <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={themePrimary} />
                      <Text className="text-primary font-bold text-xs ml-1">{copied ? "Copied" : "Copy Raw"}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    multiline
                    value={ocrTextFallback}
                    readOnly
                    className="text-muted-foreground font-mono text-xs max-h-40 bg-muted/50 p-3 rounded-xl border border-border/60"
                  />
                  <TouchableOpacity 
                    onPress={() => router.push('/(tabs)/verify/manual' as any)}
                    className="bg-primary h-14 rounded-2xl items-center justify-center flex-row active:opacity-90 mt-5 shadow-sm"
                  >
                    <Ionicons name="create-outline" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Go to Manual Entry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {!scanning && image && (
            <TouchableOpacity 
              onPress={pickImage}
              className="bg-muted h-16 rounded-2xl items-center justify-center flex-row active:opacity-85 mt-2"
            >
              <Ionicons name="image" size={24} color={isDark ? 'white' : 'black'} />
              <Text className="text-foreground font-bold text-lg ml-2">Choose Different Image</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

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