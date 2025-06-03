import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation resources
import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enValidation from "./locales/en/validation.json";
import enTasks from "./locales/en/tasks.json";
import enNotifications from "./locales/en/notifications.json";
import enTax from "./locales/en/tax.json";

import esAuth from "./locales/es/auth.json";
import esCommon from "./locales/es/common.json";
import esValidation from "./locales/es/validation.json";
import esTasks from "./locales/es/tasks.json";
import esNotifications from "./locales/es/notifications.json";
import esTax from "./locales/es/tax.json";

// Translation resources
const resources = {
  en: {
    auth: enAuth,
    common: enCommon,
    validation: enValidation,
    tasks: enTasks,
    notifications: enNotifications,
    tax: enTax,
  },
  es: {
    auth: esAuth,
    common: esCommon,
    validation: esValidation,
    tasks: esTasks,
    notifications: esNotifications,
    tax: esTax,
  },
};

// Language detection configuration
const detectionOptions = {
  // Order of detection methods
  order: ["localStorage", "navigator", "htmlTag"],

  // Cache user language
  caches: ["localStorage"],

  // Only detect these languages
  checkWhitelist: true,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,

    // Fallback language
    fallbackLng: "en",

    // Supported languages
    supportedLngs: ["en", "es"],

    // Language detection
    detection: detectionOptions,

    // Namespace configuration
    defaultNS: "common",
    ns: ["common", "auth", "validation", "tasks", "notifications", "tax"],

    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Development settings
    debug: process.env.NODE_ENV === "development",

    // React configuration
    react: {
      useSuspense: false,
    },
  });

export default i18n;
