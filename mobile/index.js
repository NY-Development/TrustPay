import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or called directly so Metro anchors here safely
export function App() {
    const ctx = require.context('./app'); // Points to your app directory
    return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);