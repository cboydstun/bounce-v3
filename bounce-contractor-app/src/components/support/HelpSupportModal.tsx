import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonCard,
  IonCardContent,
  IonAccordionGroup,
  IonAccordion,
  IonToast,
} from "@ionic/react";
import {
  closeOutline,
  mailOutline,
  callOutline,
  helpCircleOutline,
  bugOutline,
  bulbOutline,
  globeOutline,
  copyOutline,
} from "ionicons/icons";
import { supportService } from "../../services/api/supportService";
import ContactSupportForm from "./ContactSupportForm";
import BugReportForm from "./BugReportForm";
import FeatureRequestForm from "./FeatureRequestForm";
import { useSupportTranslation } from "../../hooks/common/useI18n";

interface HelpSupportModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

type ModalView = "main" | "contact" | "bug" | "feature" | "faq";

const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onDidDismiss,
}) => {
  const { t } = useSupportTranslation();
  const [currentView, setCurrentView] = useState<ModalView>("main");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const faqData = supportService.getFAQData();

  const handleClose = () => {
    setCurrentView("main");
    onDidDismiss();
  };

  const handleBack = () => {
    setCurrentView("main");
  };

  const handleEmailSupport = () => {
    supportService.openEmailSupport();
    showSuccessToast(t("toast.emailOpening"));
  };

  const handleCallSupport = () => {
    supportService.callSupport();
    showSuccessToast(t("toast.phoneOpening"));
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(t("directContact.phone"));
      showSuccessToast(t("toast.phoneCopied"));
    } catch (error) {
      showSuccessToast(`Phone: ${t("directContact.phone")}`);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(t("directContact.email"));
      showSuccessToast(t("toast.emailCopied"));
    } catch (error) {
      showSuccessToast(`Email: ${t("directContact.email")}`);
    }
  };

  const handleOpenHelpCenter = () => {
    window.open("https://www.satxbounce.com", "_blank");
    showSuccessToast(t("toast.helpCenterOpening"));
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleFormSuccess = (message: string) => {
    showSuccessToast(message);
    setCurrentView("main");
  };

  const renderMainView = () => (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("modal.title")}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="space-y-4">
          {/* Quick Actions */}
          <IonCard>
            <IonCardContent>
              <h2 className="text-lg font-semibold mb-4">
                {t("quickActions.title")}
              </h2>
              <div className="space-y-3">
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setCurrentView("contact")}
                  className="text-left"
                >
                  <IonIcon icon={mailOutline} slot="start" />
                  {t("quickActions.contactSupport")}
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setCurrentView("bug")}
                  className="text-left"
                >
                  <IonIcon icon={bugOutline} slot="start" />
                  {t("quickActions.reportBug")}
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setCurrentView("feature")}
                  className="text-left"
                >
                  <IonIcon icon={bulbOutline} slot="start" />
                  {t("quickActions.requestFeature")}
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setCurrentView("faq")}
                  className="text-left"
                >
                  <IonIcon icon={helpCircleOutline} slot="start" />
                  {t("quickActions.viewFaq")}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Direct Contact */}
          <IonCard>
            <IonCardContent>
              <h2 className="text-lg font-semibold mb-4">
                {t("directContact.title")}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <IonIcon
                      icon={callOutline}
                      className="mr-3 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">
                        {t("directContact.phone")}
                      </div>
                      <IonText className="text-sm text-gray-600">
                        {t("directContact.phoneHours")}
                      </IonText>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={handleCallSupport}
                    >
                      <IonIcon icon={callOutline} />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={handleCopyPhone}
                    >
                      <IonIcon icon={copyOutline} />
                    </IonButton>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <IonIcon
                      icon={mailOutline}
                      className="mr-3 text-green-600"
                    />
                    <div>
                      <div className="font-medium">
                        {t("directContact.email")}
                      </div>
                      <IonText className="text-sm text-gray-600">
                        {t("directContact.emailResponse")}
                      </IonText>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={handleEmailSupport}
                    >
                      <IonIcon icon={mailOutline} />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={handleCopyEmail}
                    >
                      <IonIcon icon={copyOutline} />
                    </IonButton>
                  </div>
                </div>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleOpenHelpCenter}
                  className="mt-3"
                >
                  <IonIcon icon={globeOutline} slot="start" />
                  {t("directContact.visitHelpCenter")}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </>
  );

  const renderFAQView = () => (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={handleBack}>
              {t("modal.back")}
            </IonButton>
          </IonButtons>
          <IonTitle>{t("faq.title")}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="space-y-4">
          {faqData.map((category, categoryIndex) => (
            <IonCard key={categoryIndex}>
              <IonCardContent>
                <h2 className="text-lg font-semibold mb-3">
                  {category.category}
                </h2>
                <IonAccordionGroup>
                  {category.questions.map((faq, faqIndex) => (
                    <IonAccordion
                      key={faqIndex}
                      value={`${categoryIndex}-${faqIndex}`}
                    >
                      <IonItem slot="header">
                        <IonLabel className="font-medium">
                          {faq.question}
                        </IonLabel>
                      </IonItem>
                      <div className="p-4" slot="content">
                        <IonText className="text-gray-700">
                          {faq.answer}
                        </IonText>
                      </div>
                    </IonAccordion>
                  ))}
                </IonAccordionGroup>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case "contact":
        return (
          <ContactSupportForm
            onBack={handleBack}
            onClose={handleClose}
            onSuccess={handleFormSuccess}
          />
        );
      case "bug":
        return (
          <BugReportForm
            onBack={handleBack}
            onClose={handleClose}
            onSuccess={handleFormSuccess}
          />
        );
      case "feature":
        return (
          <FeatureRequestForm
            onBack={handleBack}
            onClose={handleClose}
            onSuccess={handleFormSuccess}
          />
        );
      case "faq":
        return renderFAQView();
      default:
        return renderMainView();
    }
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
        {renderCurrentView()}
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
      />
    </>
  );
};

export default HelpSupportModal;
