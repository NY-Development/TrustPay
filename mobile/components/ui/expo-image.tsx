import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';

// expo-image gives us disk+memory caching (unlike RN's plain Image) for
// remote-uri screens. Wire up nativewind `className` support the same way
// components/ui/icon.tsx does for lucide icons, so call sites don't have to
// change their styling approach.
cssInterop(ExpoImage, {
  className: 'style',
});

export { ExpoImage as Image };
