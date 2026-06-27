import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function VerifyEntry() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const options = [
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Enter provider and transaction ID manually.',
      icon: 'create-outline',
      color: '#00E5FF',
      route: '/(tabs)/verify/manual'
    },
    {
      id: 'screenshot',
      title: 'Upload Screenshot',
      description: 'Extract ID automatically using AI OCR.',
      icon: 'image-outline',
      color: '#2979FF',
      route: '/(tabs)/verify/ocr'
    },
    {
      id: 'qr',
      title: 'Scan QR Code',
      description: 'Quickly scan customer payment QR.',
      icon: 'qr-code-outline',
      color: '#00C853',
      route: '/(tabs)/verify/scan'
    }
  ];

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 px-6">
        <Text className="text-foreground text-4xl font-bold mb-2 mt-8">Verify Payment</Text>
        <Text className="text-muted-foreground text-lg mb-12">Choose how you want to verify the transaction.</Text>

        <View className="space-y-4 gap-2">
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => router.push(option.route as any)}
              className="bg-card border border-border rounded-3xl p-6 flex-row items-center border-l-4"
              style={{ borderLeftColor: option.color }}
            >
              <View 
                style={{ backgroundColor: `${option.color}20` }}
                className="w-14 h-14 rounded-2xl items-center justify-center"
              >
                <Ionicons name={option.icon as any} size={28} color={option.color} />
              </View>
              <View className="ml-5 flex-1">
                <Text className="text-foreground text-xl font-bold">{option.title}</Text>
                <Text className="text-muted-foreground text-sm mt-1">{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={isDark ? '#1e293b' : '#cbd5e1'} />
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6 bg-primary/10 rounded-3xl p-6 overflow-hidden border border-primary/20">
          <LinearGradient
            colors={['transparent', isDark ? '#3b82f610' : '#003ec710']}
            className="absolute inset-0"
          />
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={24} color={themePrimary} />
            <Text className="text-primary font-bold text-lg ml-2">Verification Tip</Text>
          </View>
          <Text className="text-muted-foreground text-sm mt-3 leading-5">
            Screenshot verification is the fastest way. Simply take a screenshot of the payment success message and upload it here.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
