import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatTaskTime,
  formatCurrency,
  formatDistance,
  formatPhoneNumber,
  formatAddress,
  formatRelativeTime,
  isToday,
  isTomorrow,
  isYesterday,
} from "../../services/i18n/formatters";

export interface UseI18nReturn {
  // Translation function
  t: (key: string, options?: any) => string;

  // Current language
  locale: string;

  // Language switching
  changeLanguage: (lng: string) => Promise<void>;

  // Formatting functions with current locale
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatTaskTime: (date: Date) => string;
  formatCurrency: (amount: number) => string;
  formatDistance: (meters: number) => string;
  formatPhoneNumber: (phone: string) => string;
  formatAddress: (address: any) => string;
  formatRelativeTime: (date: Date) => string;

  // Date helpers
  isToday: (date: Date) => boolean;
  isTomorrow: (date: Date) => boolean;
  isYesterday: (date: Date) => boolean;

  // Language detection
  isSpanish: boolean;
  isEnglish: boolean;
}

/**
 * Custom hook for internationalization with Central Time formatting
 */
export const useI18n = (): UseI18nReturn => {
  const { t, i18n } = useTranslation();

  const locale = i18n.language;
  const isSpanish = locale.startsWith("es");
  const isEnglish = locale.startsWith("en");

  // Memoized formatting functions that use current locale
  const formatDateMemo = useCallback(
    (date: Date) => formatDate(date, locale),
    [locale],
  );
  const formatDateTimeMemo = useCallback(
    (date: Date) => formatDateTime(date, locale),
    [locale],
  );
  const formatTimeMemo = useCallback(
    (date: Date) => formatTime(date, locale),
    [locale],
  );
  const formatTaskTimeMemo = useCallback(
    (date: Date) => formatTaskTime(date, locale),
    [locale],
  );
  const formatCurrencyMemo = useCallback(
    (amount: number) => formatCurrency(amount, locale),
    [locale],
  );
  const formatDistanceMemo = useCallback(
    (meters: number) => formatDistance(meters, locale),
    [locale],
  );
  const formatRelativeTimeMemo = useCallback(
    (date: Date) => formatRelativeTime(date, locale),
    [locale],
  );

  // Language switching function
  const changeLanguage = useCallback(
    async (lng: string) => {
      await i18n.changeLanguage(lng);
    },
    [i18n],
  );

  return {
    t,
    locale,
    changeLanguage,
    formatDate: formatDateMemo,
    formatDateTime: formatDateTimeMemo,
    formatTime: formatTimeMemo,
    formatTaskTime: formatTaskTimeMemo,
    formatCurrency: formatCurrencyMemo,
    formatDistance: formatDistanceMemo,
    formatPhoneNumber,
    formatAddress,
    formatRelativeTime: formatRelativeTimeMemo,
    isToday,
    isTomorrow,
    isYesterday,
    isSpanish,
    isEnglish,
  };
};

/**
 * Hook for translation with namespace
 */
export const useTranslationWithNamespace = (namespace: string) => {
  const { t, i18n } = useTranslation(namespace);
  const { formatTaskTime, formatCurrency, formatDistance } = useI18n();

  return {
    t,
    locale: i18n.language,
    formatTaskTime,
    formatCurrency,
    formatDistance,
  };
};

/**
 * Hook specifically for auth translations
 */
export const useAuthTranslation = () => {
  return useTranslationWithNamespace("auth");
};

/**
 * Hook specifically for task translations
 */
export const useTaskTranslation = () => {
  return useTranslationWithNamespace("tasks");
};

/**
 * Hook specifically for notification translations
 */
export const useNotificationTranslation = () => {
  return useTranslationWithNamespace("notifications");
};

/**
 * Hook specifically for validation translations
 */
export const useValidationTranslation = () => {
  return useTranslationWithNamespace("validation");
};

/**
 * Hook specifically for tax translations
 */
export const useTaxTranslation = () => {
  return useTranslationWithNamespace("tax");
};

/**
 * Hook specifically for support translations
 */
export const useSupportTranslation = () => {
  return useTranslationWithNamespace("support");
};
