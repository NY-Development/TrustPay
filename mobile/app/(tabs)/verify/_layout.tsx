import { Stack } from "expo-router";

export default function VerifyLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="manual" />
            <Stack.Screen name="ocr" />
            <Stack.Screen name="scan" />
        </Stack>
    );
}