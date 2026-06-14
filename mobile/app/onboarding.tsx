import React from 'react';
import { Text, View, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Instant Payment Verification',
    description: 'Verify Telebirr, CBE, and M-Pesa payments in seconds using manual entry or screenshot upload.',
    image: 'https://cdn.pixabay.com/photo/2021/08/04/13/06/software-developer-6521720_1280.jpg' // Placeholder
  },
  {
    title: 'AI-Powered OCR',
    description: 'No more typing long transaction IDs. Simply upload a screenshot and let our AI handle the rest.',
    image: 'https://cdn.pixabay.com/photo/2020/07/08/04/12/work-5382506_1280.jpg'
  },
  {
    title: 'Idempotency Protection',
    description: 'Never worry about duplicate payment claims. Our system flags already verified transactions instantly.',
    image: 'https://cdn.pixabay.com/photo/2014/11/17/13/17/cross-534602_1280.jpg'
  }
];

export default function Onboarding() {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleNext = () => {
    if (activeIndex === slides.length - 1) {
      router.replace('/(auth)/login');
    } else {
      setActiveIndex(activeIndex + 1);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', 'black']}
        className="absolute inset-0 z-10"
      />
      
      <Image
        source={{ uri: slides[activeIndex].image }}
        className="absolute w-full h-full"
        resizeMode="cover"
      />

      <View className="flex-1 justify-end px-6 pb-20 z-20">
        <Text className="text-white text-4xl font-bold mb-4 leading-tight">
          {slides[activeIndex].title}
        </Text>
        <Text className="text-zinc-400 text-lg mb-12 leading-7">
          {slides[activeIndex].description}
        </Text>

        <View className="flex-row mb-12">
          {slides.map((_, i) => (
            <View 
              key={i}
              className={`h-1.5 rounded-full mr-2 ${i === activeIndex ? 'w-8 bg-[#00E5FF]' : 'w-2 bg-zinc-700'}`}
            />
          ))}
        </View>

        <TouchableOpacity 
          onPress={handleNext}
          className="bg-[#00E5FF] h-16 rounded-2xl items-center justify-center active:opacity-90"
        >
          <Text className="text-black font-bold text-xl">
            {activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.replace('/(auth)/login')}
          className="mt-6 items-center"
        >
          <Text className="text-zinc-500 font-medium text-base">Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
