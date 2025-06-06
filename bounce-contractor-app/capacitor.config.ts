import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bouncecontractor.app",
  appName: "Bounce Contractor",
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    hostname: "api.slowbill.xyz",
    allowNavigation: [
      "https://api.slowbill.xyz",
      "https://slowbill.xyz",
      "https://*.cloudinary.com",
      "https://*.sendgrid.net",
      "https://*.intuit.com"
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1976d2",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#1976d2",
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
};

export default config;
