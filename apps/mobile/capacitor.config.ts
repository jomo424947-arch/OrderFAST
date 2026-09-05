import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastorder.app',
  appName: 'FastOrder',
  webDir: 'www',

  // WebView mode — loads the live deployed site
  server: {
    url: 'https://www.fast0rder.online',
    cleartext: false,
    androidScheme: 'https',
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2500,
      launchFadeOutDuration: 500,
      backgroundColor: '#1A1612',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFFBF5',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  android: {
    allowMixedContent: false,
    backgroundColor: '#FFFBF5',
    captureInput: true,
    webContentsDebuggingEnabled: false,
    overrideUserAgent: 'FastOrder-Android/1.0',
    appendUserAgent: 'FastOrder-Android/1.0',
  },
};

export default config;
