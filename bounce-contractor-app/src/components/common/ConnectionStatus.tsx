<<<<<<< HEAD
import React from "react";
import { IonIcon, IonChip, IonSpinner } from "@ionic/react";
import {
  wifiOutline,
  cloudOfflineOutline,
  checkmarkCircle,
  alertCircle,
} from "ionicons/icons";
import { useRealtimeStore } from "../../store/realtimeStore";

export interface ConnectionStatusProps {
  showText?: boolean;
  size?: "small" | "default" | "large";
=======
import React from 'react';
import { IonIcon, IonChip, IonSpinner } from '@ionic/react';
import { wifiOutline, cloudOfflineOutline, checkmarkCircle, alertCircle } from 'ionicons/icons';
import { useRealtimeStore } from '../../store/realtimeStore';

export interface ConnectionStatusProps {
  showText?: boolean;
  size?: 'small' | 'default' | 'large';
>>>>>>> 5772b46b8 (notifications)
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showText = true,
<<<<<<< HEAD
  size = "default",
  className = "",
=======
  size = 'default',
  className = '',
>>>>>>> 5772b46b8 (notifications)
}) => {
  const { isConnected, connectionStatus } = useRealtimeStore();

  const getStatusConfig = () => {
    if (connectionStatus.isConnecting) {
      return {
<<<<<<< HEAD
        color: "warning",
        icon: <IonSpinner name="crescent" />,
        text: "Connecting...",
        label: "Connecting to real-time updates",
=======
        color: 'warning',
        icon: <IonSpinner name="crescent" />,
        text: 'Connecting...',
        label: 'Connecting to real-time updates',
>>>>>>> 5772b46b8 (notifications)
      };
    }

    if (isConnected) {
      return {
<<<<<<< HEAD
        color: "success",
        icon: checkmarkCircle,
        text: "Connected",
        label: "Real-time updates active",
=======
        color: 'success',
        icon: checkmarkCircle,
        text: 'Connected',
        label: 'Real-time updates active',
>>>>>>> 5772b46b8 (notifications)
      };
    }

    if (connectionStatus.lastError) {
      return {
<<<<<<< HEAD
        color: "danger",
        icon: alertCircle,
        text: "Connection Error",
=======
        color: 'danger',
        icon: alertCircle,
        text: 'Connection Error',
>>>>>>> 5772b46b8 (notifications)
        label: `Connection failed: ${connectionStatus.lastError}`,
      };
    }

    return {
<<<<<<< HEAD
      color: "medium",
      icon: cloudOfflineOutline,
      text: "Offline",
      label: "Real-time updates unavailable",
=======
      color: 'medium',
      icon: cloudOfflineOutline,
      text: 'Offline',
      label: 'Real-time updates unavailable',
>>>>>>> 5772b46b8 (notifications)
    };
  };

  const config = getStatusConfig();

  if (!showText) {
    return (
      <IonIcon
<<<<<<< HEAD
        icon={typeof config.icon === "string" ? config.icon : wifiOutline}
=======
        icon={typeof config.icon === 'string' ? config.icon : wifiOutline}
>>>>>>> 5772b46b8 (notifications)
        color={config.color}
        size={size}
        className={className}
        title={config.label}
      />
    );
  }

  return (
<<<<<<< HEAD
    <IonChip color={config.color} className={className} title={config.label}>
      {typeof config.icon === "string" ? (
=======
    <IonChip
      color={config.color}
      className={className}
      title={config.label}
    >
      {typeof config.icon === 'string' ? (
>>>>>>> 5772b46b8 (notifications)
        <IonIcon icon={config.icon} />
      ) : (
        config.icon
      )}
      {showText && <span className="ml-1">{config.text}</span>}
    </IonChip>
  );
};

export default ConnectionStatus;
