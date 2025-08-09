import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
  // Ensure we're running in browser
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    document.head.appendChild(script);
    script.onload = () => {
      // @ts-ignore
      eruda.init();
    };
  }
}
