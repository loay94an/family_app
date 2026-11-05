import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loay94an.familyapp',
  appName: 'مشجرة العائلة',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
