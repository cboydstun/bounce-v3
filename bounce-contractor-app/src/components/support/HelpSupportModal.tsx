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

interface HelpSupportModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

type ModalView = "main" | "contact" | "bug" | "feature" | "faq";

const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onDidDismiss,
}) => {
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
    showSuccessToast("Opening email client...");
  };

  const handleCallSupport = () => {
    supportService.callSupport();
    showSuccessToast("Opening phone dialer...");
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText("(512) 210-0194");
      showSuccessToast("Phone number copied to clipboard");
    } catch (error) {
      showSuccessToast("Phone: (512) 210-0194");
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("satxbounce@gmail.com");
      showSuccessToast("Email address copied to clipboard");
    } catch (error) {
      showSuccessToast("Email: satxbounce@gmail.com");
    }
  };

  const handleOpenHelpCenter = () => {
    window.open("https://www.satxbounce.com", "_blank");
    showSuccessToast("Opening help center...");
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
          <IonTitle>Help & Support</IonTitle>
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
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setCurrentView("contact")}
                  className="text-left"
                >
                  <IonIcon icon={mailOutline} slot="start" />
                  Contact Support
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setCurrentView("bug")}
                  className="text-left"
                >
                  <IonIcon icon={bugOutline} slot="start" />
                  Report Bug
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setCurrentView("feature")}
                  className="text-left"
                >
                  <IonIcon icon={bulbOutline} slot="start" />
                  Request Feature
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setCurrentView("faq")}
                  className="text-left"
                >
                  <IonIcon icon={helpCircleOutline} slot="start" />
                  View FAQ
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Direct Contact */}
          <IonCard>
            <IonCardContent>
              <h2 className="text-lg font-semibold mb-4">Direct Contact</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <IonIcon
                      icon={callOutline}
                      className="mr-3 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">(512) 210-0194</div>
                      <IonText className="text-sm text-gray-600">
                        Mon-Fri 8AM-6PM CST
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
                      <div className="font-medium">satxbounce@gmail.com</div>
                      <IonText className="text-sm text-gray-600">
                        Response within 24 hours
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
                  Visit Help Center
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
              ← Back
            </IonButton>
          </IonButtons>
          <IonTitle>Frequently Asked Questions</IonTitle>
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
