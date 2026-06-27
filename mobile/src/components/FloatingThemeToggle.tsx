import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { Sun, Moon } from 'lucide-react-native';
import { Storage, STORAGE_KEYS } from '../utils/storage';

const BUTTON_SIZE = 56;
const EDGE_PADDING = 20;

export const FloatingThemeToggle = () => {
  const { width, height } = useWindowDimensions();
  const { colorScheme, setColorScheme } = useColorScheme();
  
  const translateX = useSharedValue(width - BUTTON_SIZE - EDGE_PADDING);
  const translateY = useSharedValue(100);
  const isPressed = useSharedValue(false);

  useEffect(() => {
    // Load saved position
    Storage.getItem<{ x: number; y: number }>(STORAGE_KEYS.THEME_BUTTON_POSITION).then((pos) => {
      if (pos) {
        translateX.value = withSpring(pos.x);
        translateY.value = withSpring(pos.y);
      }
    });
  }, []);

  const savePosition = (x: number, y: number) => {
    Storage.setItem(STORAGE_KEYS.THEME_BUTTON_POSITION, { x, y });
  };

  const tapGesture = Gesture.Tap().onEnd(() => {
    const nextScheme = colorScheme === 'dark' ? 'light' : 'dark';
    runOnJS(setColorScheme)(nextScheme);
  });

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onBegin(() => {
      isPressed.value = true;
    })
    .onUpdate((event) => {
      translateX.value = event.absoluteX - BUTTON_SIZE / 2;
      translateY.value = event.absoluteY - BUTTON_SIZE / 2;
    })
    .onEnd(() => {
      isPressed.value = false;
      
      // Snap to edges horizontally
      const snapX = translateX.value > width / 2 
        ? width - BUTTON_SIZE - EDGE_PADDING 
        : EDGE_PADDING;
      
      // Clamp vertically
      const clampedY = Math.min(
        Math.max(translateY.value, EDGE_PADDING + 40), 
        height - BUTTON_SIZE - EDGE_PADDING - 40
      );

      translateX.value = withSpring(snapX);
      translateY.value = withSpring(clampedY);
      
      runOnJS(savePosition)(snapX, clampedY);
    });

  const gesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isPressed.value ? 1.2 : 1) },
    ],
    opacity: withSpring(isPressed.value ? 0.9 : 1),
  }));

  const Icon = colorScheme === 'dark' ? Moon : Sun;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View 
        style={[styles.container, animatedStyle]}
        className="bg-primary dark:bg-white items-center justify-center shadow-xl"
      >
        <Icon size={28} color={colorScheme === 'dark' ? '#000' : '#fff'} />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    zIndex: 9999,
    elevation: 5,
  },
});
