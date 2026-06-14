import React from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface StatusModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ 
  visible, 
  type, 
  title, 
  message, 
  onClose 
}) => {
  const iconName = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle';
  const iconColor = type === 'success' ? '#00E5FF' : type === 'error' ? '#FF3D00' : '#2979FF';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center px-6">
        <BlurView intensity={20} tint="dark" className="absolute inset-0" />
        
        <View className="bg-[#1A1A1A] border border-white/10 w-full rounded-3xl p-8 items-center">
          <View 
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Ionicons name={iconName} size={48} color={iconColor} />
          </View>
          
          <Text className="text-white text-2xl font-bold mb-2 text-center">{title}</Text>
          <Text className="text-zinc-400 text-base text-center mb-8 leading-6">{message}</Text>
          
          <TouchableOpacity 
            onPress={onClose}
            className="w-full bg-zinc-800 h-14 rounded-xl items-center justify-center active:bg-zinc-700"
          >
            <Text className="text-white font-bold text-lg">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
