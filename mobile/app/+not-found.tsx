import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className='flex text-center items-center justify-center'>
        <Text className='text-2xl text-red-500 font-bold'>This screen doesn't exist.</Text>

        <Link href="/">
          <Text className='text-xl text-primary underline italic'>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
