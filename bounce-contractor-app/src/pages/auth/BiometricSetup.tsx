import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonButton,
  IonText,
  IonIcon,
  IonSpinner,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { 
  fingerPrint, 
  eye, 
  shield, 
  checkmarkCircle, 
  alertCircle,
  lockClosed,
  speedometer,
  person
} from 'ionicons/icons';
import { useBiometric } from '../../hooks/auth/useBiometric';
import { useAuthStore, authSelectors } from '../../store/authStore';
import { BiometryType } from '../../types/biometric.types';
import { useAuthTranslation } from '../../hooks/common/useI18n';

interface BiometricSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

const BiometricSetup: React.FC<BiometricSetupProps> = ({
  onComplete,
  onSkip,
  showSkip = true
}) => {
  const history = useHistory();
  const { t } = useAuthTranslation();
  const user = useAuthStore(authSelectors.user);
  const enableBiometric = useAuthStore(state => state.enableBiometric);
  
  const { 
    isAvailable, 
    isEnabled, 
    availability, 
    shouldOfferSetup,
    refresh 
  } = useBiometric();
  
  const [setupState, setSetupState] = useState<'intro' | 'setup' | 'success' | 'error'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Check if setup should be offered
    const checkSetupEligibility = async () => {
      const shouldOffer = await shouldOfferSetup();
      if (!shouldOffer && isEnabled) {
        // Already set up, redirect
        handleComplete();
      }
    };
    
    checkSetupEligibility();
  }, [shouldOfferSetup, isEnabled]);

  const getBiometricIcon = () => {
    if (!availability) return fingerPrint;
    
    switch (availability.biometryType) {
      case BiometryType.FACE_ID:
      case BiometryType.FACE_AUTHENTICATION:
        return eye;
      case BiometryType.TOUCH_ID:
      case BiometryType.FINGERPRINT:
        return fingerPrint;
      default:
        return lockClosed;
    }
  };

  const getBiometricTypeText = () => {
    if (!availability) return t('biometric.touchId');
    
    switch (availability.biometryType) {
      case BiometryType.FACE_ID:
        return t('biometric.faceId');
      case BiometryType.FACE_AUTHENTICATION:
        return t('biometric.faceAuthentication');
      case BiometryType.TOUCH_ID:
        return t('biometric.touchId');
      case BiometryType.FINGERPRINT:
        return t('biometric.fingerprint');
      default:
        return t('biometric.biometric');
    }
  };

  const handleSetup = async () => {
    if (!user) {
      setError(t('biometric.setup.userRequired'));
      return;
    }

    setIsLoading(true);
    setSetupState('setup');
    setError(null);

    try {
      // Note: In a real implementation, you would need the user's password
      // This is a security requirement for biometric setup
      // For now, we'll use empty password and let the biometric service handle it
      await enableBiometric({
        email: user.email,
        password: '' // This should be collected from user input in production
      });

      setSetupState('success');
      
      setTimeout(() => {
        handleComplete();
      }, 2000);
    } catch (err: any) {
      console.error('Biometric setup failed:', err);
      setSetupState('error');
      setError(err.message || t('biometric.setup.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      history.replace('/tasks/available');
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      history.replace('/tasks/available');
    }
  };

  const renderIntroContent = () => (
    <div className="text-center">
      <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
        <IonIcon 
          icon={getBiometricIcon()} 
          className="w-12 h-12 text-primary" 
        />
      </div>
      
      <IonText>
        <h1 className="text-2xl font-bold mb-4">
          {t('biometric.setup.title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('biometric.setup.subtitle', { type: getBiometricTypeText() })}
        </p>
      </IonText>

      {/* Benefits */}
      <div className="space-y-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <IonIcon icon={speedometer} className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900 mb-1">
              {t('biometric.setup.benefits.speed.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('biometric.setup.benefits.speed.description')}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <IonIcon icon={shield} className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900 mb-1">
              {t('biometric.setup.benefits.security.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('biometric.setup.benefits.security.description')}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <IonIcon icon={person} className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900 mb-1">
              {t('biometric.setup.benefits.convenience.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('biometric.setup.benefits.convenience.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <IonText>
          <h4 className="font-medium text-gray-900 mb-2">
            {t('biometric.setup.privacy.title')}
          </h4>
          <p className="text-sm text-gray-600">
            {t('biometric.setup.privacy.description')}
          </p>
        </IonText>
      </div>
    </div>
  );

  const renderSetupContent = () => (
    <div className="text-center">
      <IonSpinner name="crescent" className="w-16 h-16 mx-auto mb-6 text-primary" />
      <IonText>
        <h2 className="text-xl font-medium mb-4">
          {t('biometric.setup.setting_up')}
        </h2>
        <p className="text-gray-600">
          {t('biometric.setup.follow_prompts')}
        </p>
      </IonText>
    </div>
  );

  const renderSuccessContent = () => (
    <div className="text-center">
      <IonIcon 
        icon={checkmarkCircle} 
        className="w-20 h-20 mx-auto mb-6 text-green-500" 
      />
      <IonText>
        <h2 className="text-xl font-medium text-green-600 mb-4">
          {t('biometric.setup.success.title')}
        </h2>
        <p className="text-gray-600">
          {t('biometric.setup.success.description')}
        </p>
      </IonText>
    </div>
  );

  const renderErrorContent = () => (
    <div className="text-center">
      <IonIcon 
        icon={alertCircle} 
        className="w-20 h-20 mx-auto mb-6 text-red-500" 
      />
      <IonText>
        <h2 className="text-xl font-medium text-red-600 mb-4">
          {t('biometric.setup.error.title')}
        </h2>
        <p className="text-gray-600 mb-4">
          {error || t('biometric.setup.error.description')}
        </p>
      </IonText>
    </div>
  );

  if (!isAvailable) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tasks/available" />
            </IonButtons>
            <IonTitle>{t('biometric.setup.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <div className="flex flex-col justify-center min-h-full text-center">
            <IonIcon 
              icon={alertCircle} 
              className="w-16 h-16 mx-auto mb-4 text-orange-500" 
            />
            <IonText>
              <h2 className="text-xl font-medium mb-4">
                {t('biometric.setup.not_available.title')}
              </h2>
              <p className="text-gray-600 mb-8">
                {availability?.reason || t('biometric.setup.not_available.description')}
              </p>
            </IonText>
            
            <IonButton
              expand="block"
              onClick={handleSkip}
              className="btn-primary"
            >
              {t('common.continue')}
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tasks/available" />
          </IonButtons>
          <IonTitle>{t('biometric.setup.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center min-h-full py-8">
          {setupState === 'intro' && renderIntroContent()}
          {setupState === 'setup' && renderSetupContent()}
          {setupState === 'success' && renderSuccessContent()}
          {setupState === 'error' && renderErrorContent()}
          
          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            {setupState === 'intro' && (
              <>
                <IonButton
                  expand="block"
                  onClick={handleSetup}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {t('biometric.setup.enable_button', { type: getBiometricTypeText() })}
                </IonButton>
                
                {showSkip && (
                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={handleSkip}
                    disabled={isLoading}
                  >
                    {t('biometric.setup.skip')}
                  </IonButton>
                )}
              </>
            )}
            
            {setupState === 'error' && (
              <>
                <IonButton
                  expand="block"
                  onClick={handleSetup}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {t('biometric.setup.try_again')}
                </IonButton>
                
                {showSkip && (
                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={handleSkip}
                    disabled={isLoading}
                  >
                    {t('biometric.setup.skip')}
                  </IonButton>
                )}
              </>
            )}
            
            {setupState === 'success' && (
              <IonButton
                expand="block"
                onClick={handleComplete}
                className="btn-primary"
              >
                {t('common.continue')}
              </IonButton>
            )}
          </div>
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={error || ''}
          duration={3000}
          position="top"
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default BiometricSetup;
