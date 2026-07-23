import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export interface AuthHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthHelpModal: React.FC<AuthHelpModalProps> = ({ visible, onClose }) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center px-6">
        <BlurView intensity={20} tint="dark" className="absolute inset-0" />

        <View className="bg-card border border-border w-full rounded-3xl p-6">
          <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 z-10 p-1">
            <Ionicons name="close" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <Text className="text-foreground text-xl font-bold mb-1.5">
            Signing in for the first time?
          </Text>
          <Text className="text-muted-foreground text-sm mb-5 leading-5">
            Trust Pay accounts work in two tiers — here's which one applies to you.
          </Text>

          <View className="flex-row gap-3 bg-muted rounded-2xl p-4 mb-3 border border-border">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center shrink-0">
              <Ionicons name="business" size={20} color="#003ec7" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-bold mb-1">I'm a business owner</Text>
              <Text className="text-muted-foreground text-xs leading-5">
                Tap Register to set up your company and first branch. Once you're in, invite your staff from Dashboard{' '}→{' '}Employees — each invite creates their own employee login.
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3 bg-muted rounded-2xl p-4 mb-5 border border-border">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center shrink-0">
              <Ionicons name="person" size={20} color="#003ec7" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-bold mb-1">I'm an employee</Text>
              <Text className="text-muted-foreground text-xs leading-5">
                You don't need to register. Switch to the Employee tab on the sign-in form and use the email and password your business owner set up for you.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="w-full bg-primary h-14 rounded-xl items-center justify-center active:opacity-90"
          >
            <Text className="text-primary-foreground font-bold text-base">Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
