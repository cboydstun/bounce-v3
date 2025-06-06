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
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showText = true,
  size = "default",
  className = "",
}) => {
  const { isConnected, connectionStatus } = useRealtimeStore();

  const getStatusConfig = () => {
    if (connectionStatus.isConnecting) {
      return {
        color: "warning",
        icon: <IonSpinner name="crescent" />,
        text: "Connecting...",
        label: "Connecting to real-time updates",
      };
    }

    if (isConnected) {
      return {
        color: "success",
        icon: checkmarkCircle,
        text: "Connected",
        label: "Real-time updates active",
      };
    }

    if (connectionStatus.lastError) {
      return {
        color: "danger",
        icon: alertCircle,
        text: "Connection Error",
        label: `Connection failed: ${connectionStatus.lastError}`,
      };
    }

    return {
      color: "medium",
      icon: cloudOfflineOutline,
      text: "Offline",
      label: "Real-time updates unavailable",
    };
  };

  const config = getStatusConfig();

  if (!showText) {
    return (
      <IonIcon
        icon={typeof config.icon === "string" ? config.icon : wifiOutline}
        color={config.color}
        size={size}
        className={className}
        title={config.label}
      />
    );
  }

  return (
    <IonChip color={config.color} className={className} title={config.label}>
      {typeof config.icon === "string" ? (
        <IonIcon icon={config.icon} />
      ) : (
        config.icon
      )}
      {showText && <span className="ml-1">{config.text}</span>}
    </IonChip>
  );
};

export default ConnectionStatus;
