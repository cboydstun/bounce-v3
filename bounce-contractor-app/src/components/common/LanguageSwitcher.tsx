import React from "react";
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonItem,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { languageOutline } from "ionicons/icons";
import { useI18n } from "../../hooks/common/useI18n";

interface LanguageSwitcherProps {
  variant?: "segment" | "select" | "minimal";
  className?: string;
}

/**
 * Language switcher component with multiple display variants
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "segment",
  className = "",
}) => {
  const { locale, changeLanguage, t } = useI18n();

  const handleLanguageChange = async (newLanguage: string) => {
    await changeLanguage(newLanguage);
  };

  if (variant === "segment") {
    return (
      <IonSegment
        value={locale}
        onIonChange={(e) => handleLanguageChange(e.detail.value as string)}
        className={className}
      >
        <IonSegmentButton value="en">
          <IonLabel>English</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="es">
          <IonLabel>Español</IonLabel>
        </IonSegmentButton>
      </IonSegment>
    );
  }

  if (variant === "select") {
    return (
      <IonItem className={className}>
        <IonIcon icon={languageOutline} slot="start" />
        <IonLabel>{t("common.app.language", "Language")}</IonLabel>
        <IonSelect
          value={locale}
          placeholder="Select Language"
          onIonChange={(e) => handleLanguageChange(e.detail.value)}
        >
          <IonSelectOption value="en">English</IonSelectOption>
          <IonSelectOption value="es">Español</IonSelectOption>
        </IonSelect>
      </IonItem>
    );
  }

  // Minimal variant - just the current language with click to toggle
  return (
    <div
      className={`flex items-center cursor-pointer ${className}`}
      onClick={() => handleLanguageChange(locale === "en" ? "es" : "en")}
    >
      <IonIcon icon={languageOutline} className="mr-2" />
      <span className="text-sm font-medium">
        {locale === "en" ? "EN" : "ES"}
      </span>
    </div>
  );
};

/**
 * Compact language toggle button
 */
export const LanguageToggle: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { locale, changeLanguage } = useI18n();

  const toggleLanguage = async () => {
    const newLanguage = locale === "en" ? "es" : "en";
    await changeLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center justify-center
        w-10 h-10 rounded-full
        bg-gray-100 hover:bg-gray-200
        transition-colors duration-200
        ${className}
      `}
      aria-label={`Switch to ${locale === "en" ? "Spanish" : "English"}`}
    >
      <span className="text-sm font-bold text-gray-700">
        {locale === "en" ? "ES" : "EN"}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
