import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
} from '@ionic/react';
import { 
  fingerPrint, 
  eye, 
  close, 
  checkmarkCircle, 
  alertCircle,
  lockClosed 
} from 'ionicons/icons';
import { useBiometric } from '../../hooks/auth/useBiometric';
import { 
  BiometricPromptOptions, 
  BiometryType,
  BiometricErrorCode 
} from '../../types/biometric.types';
import { useAuthTranslation } from '../../hooks/common/useI18n';

interface BiometricPromptProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
  options: BiometricPromptOptions;
  showFallback?: boolean;
  onFallback?: () => void;
}

const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  isOpen,
  onDidDismiss,
  onSuccess,
  onError,
  options,
  showFallback = true,
  onFallback
}) => {
  const { t } = useAuthTranslation();
  const { 
    authenticate, 
    isLoading, 
    error, 
    availability, 
    clearError 
  } = useBiometric();
  
  const [authState, setAuthState] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = options.maxAttempts || 3;

  useEffect(() => {
    if (isOpen) {
      setAuthState('idle');
      setAttempts(0);
      clearError();
    }
  }, [isOpen, clearError]);

  const handleAuthenticate = async () => {
    if (attempts >= maxAttempts) {
      onError('Maximum authentication attempts exceeded');
      return;
    }

    setAuthState('authenticating');
    setAttempts(prev => prev + 1);

    try {
      const result = await authenticate(options);
      
      if (result.success) {
        setAuthState('success');
        setTimeout(() => {
          onSuccess();
          onDidDismiss();
        }, 1000);
      } else {
        setAuthState('error');
        
        // Handle specific error cases
        if (result.errorCode === BiometricErrorCode.USER_CANCEL) {
          onDidDismiss();
          return;
        }
        
        if (result.errorCode === BiometricErrorCode.USER_FALLBACK && onFallback) {
          onFallback();
          onDidDismiss();
          return;
        }
        
        const errorMessage = result.error || 'Biometric authentication failed';
        
        if (attempts >= maxAttempts) {
          onError(errorMessage);
          onDidDismiss();
        } else {
          // Allow retry
          setTimeout(() => {
            setAuthState('idle');
          }, 2000);
        }
      }
    } catch (err: any) {
      setAuthState('error');
      const errorMessage = err.message || 'Authentication failed';
      
      if (attempts >= maxAttempts) {
        onError(errorMessage);
        onDidDismiss();
      } else {
        setTimeout(() => {
          setAuthState('idle');
        }, 2000);
      }
    }
  };

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

  const getStateContent = () => {
    switch (authState) {
      case 'authenticating':
        return (
          <div className="text-center">
            <IonSpinner name="crescent" className="w-16 h-16 mx-auto mb-4 text-primary" />
            <IonText>
              <h3 className="text-lg font-medium mb-2">{t('biometric.authenticating')}</h3>
              <p className="text-gray-600">{t('biometric.authenticatingMessage')}</p>
            </IonText>
          </div>
        );
        
      case 'success':
        return (
          <div className="text-center">
            <IonIcon 
              icon={checkmarkCircle} 
              className="w-16 h-16 mx-auto mb-4 text-green-500" 
            />
            <IonText>
              <h3 className="text-lg font-medium text-green-600">{t('biometric.success')}</h3>
            </IonText>
          </div>
        );
        
      case 'error':
        return (
          <div className="text-center">
            <IonIcon 
              icon={alertCircle} 
              className="w-16 h-16 mx-auto mb-4 text-red-500" 
            />
            <IonText>
              <h3 className="text-lg font-medium text-red-600 mb-2">{t('biometric.failed')}</h3>
              <p className="text-gray-600 mb-4">
                {error || t('biometric.tryAgain')}
              </p>
              {attempts < maxAttempts && (
                <p className="text-sm text-gray-500">
                  {t('biometric.attemptsRemaining', { 
                    remaining: maxAttempts - attempts 
                  })}
                </p>
              )}
            </IonText>
          </div>
        );
        
      default:
        return (
          <div className="text-center">
            <IonIcon 
              icon={getBiometricIcon()} 
              className="w-20 h-20 mx-auto mb-6 text-primary" 
            />
            <IonText>
              <h3 className="text-xl font-medium mb-2">
                {options.title || t('biometric.authenticate')}
              </h3>
              <p className="text-gray-600 mb-2">
                {options.subtitle || t('biometric.useYourBiometric', { 
                  type: getBiometricTypeText() 
                })}
              </p>
              {options.description && (
                <p className="text-sm text-gray-500 mb-4">
                  {options.description}
                </p>
              )}
              <p className="text-lg font-medium text-primary">
                {options.reason}
              </p>
            </IonText>
          </div>
        );
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{options.title || t('biometric.authenticate')}</IonTitle>
          <IonButton 
            fill="clear" 
            slot="end" 
            onClick={onDidDismiss}
            disabled={authState === 'authenticating'}
          >
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center min-h-full py-8">
          {getStateContent()}
          
          <div className="mt-8 space-y-4">
            {authState === 'idle' && (
              <IonButton
                expand="block"
                onClick={handleAuthenticate}
                className="btn-primary"
                disabled={isLoading}
              >
                {t('biometric.authenticate')}
              </IonButton>
            )}
            
            {authState === 'error' && attempts < maxAttempts && (
              <IonButton
                expand="block"
                onClick={handleAuthenticate}
                className="btn-primary"
                disabled={isLoading}
              >
                {t('biometric.tryAgain')}
              </IonButton>
            )}
            
            {showFallback && onFallback && authState !== 'success' && (
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => {
                  onFallback();
                  onDidDismiss();
                }}
                disabled={authState === 'authenticating'}
              >
                {options.fallbackTitle || t('biometric.usePassword')}
              </IonButton>
            )}
            
            <IonButton
              expand="block"
              fill="clear"
              onClick={onDidDismiss}
              disabled={authState === 'authenticating'}
            >
              {options.negativeButtonText || t('common.cancel')}
            </IonButton>
          </div>
          
          {/* Biometric Info */}
          {availability && authState === 'idle' && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <IonItem lines="none" className="px-0">
                <IonLabel>
                  <h3 className="text-sm font-medium text-gray-700">
                    {t('biometric.availableMethod')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getBiometricTypeText()}
                  </p>
                </IonLabel>
              </IonItem>
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BiometricPrompt;
