import React, { useState, useEffect } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar,
  IonBadge,
  IonChip,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import {
  bug,
  close,
  download,
  refresh,
  checkmarkCircle,
  alertCircle,
  informationCircle,
  warningOutline,
} from "ionicons/icons";
import {
  biometricDebugLogger,
  BiometricDebugLog,
} from "../../utils/biometricDebugLogger";
import { secureStorage } from "../../services/storage/secureStorage";
import { biometricService } from "../../services/auth/biometricService";

interface BiometricDebugPanelProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const BiometricDebugPanel: React.FC<BiometricDebugPanelProps> = ({
  isOpen,
  onDidDismiss,
}) => {
  const [logs, setLogs] = useState<BiometricDebugLog[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshLogs = async () => {
    setIsRefreshing(true);
    try {
      const currentLogs = biometricDebugLogger.getLogs();
      setLogs(currentLogs);

      // Get system info
      const isEnabled = await biometricService.isEnabled();
      const settings = await biometricService.getSettings();
      const availability = await biometricService.isAvailable();
      const hasCredentials = !!(await secureStorage.getBiometricCredentials());
      const storageAvailable = await secureStorage.isAvailable();

      setSystemInfo({
        isEnabled,
        settings,
        availability,
        hasCredentials,
        storageAvailable,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to refresh debug info:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  const handleRefresh = async (event: CustomEvent) => {
    await refreshLogs();
    event.detail.complete();
  };

  const exportLogs = () => {
    const exportData = {
      logs,
      systemInfo,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `biometric-debug-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    biometricDebugLogger.clearLogs();
    setLogs([]);
  };

  const getLogIcon = (success: boolean) => {
    return success ? checkmarkCircle : alertCircle;
  };

  const getLogColor = (success: boolean) => {
    return success ? "success" : "danger";
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getOperationSummary = () => {
    const operations = logs.reduce(
      (acc, log) => {
        if (!acc[log.operation]) {
          acc[log.operation] = { total: 0, success: 0, failed: 0 };
        }
        acc[log.operation].total++;
        if (log.success) {
          acc[log.operation].success++;
        } else {
          acc[log.operation].failed++;
        }
        return acc;
      },
      {} as Record<string, { total: number; success: number; failed: number }>,
    );

    return operations;
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Biometric Debug Panel</IonTitle>
          <IonButton fill="clear" slot="end" onClick={onDidDismiss}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* System Status */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>System Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Biometric Enabled:</span>
                <IonBadge color={systemInfo.isEnabled ? "success" : "danger"}>
                  {systemInfo.isEnabled ? "Yes" : "No"}
                </IonBadge>
              </div>
              <div className="flex justify-between">
                <span>Has Credentials:</span>
                <IonBadge
                  color={systemInfo.hasCredentials ? "success" : "danger"}
                >
                  {systemInfo.hasCredentials ? "Yes" : "No"}
                </IonBadge>
              </div>
              <div className="flex justify-between">
                <span>Storage Available:</span>
                <IonBadge
                  color={systemInfo.storageAvailable ? "success" : "danger"}
                >
                  {systemInfo.storageAvailable ? "Yes" : "No"}
                </IonBadge>
              </div>
              <div className="flex justify-between">
                <span>Device Available:</span>
                <IonBadge
                  color={
                    systemInfo.availability?.isAvailable ? "success" : "danger"
                  }
                >
                  {systemInfo.availability?.isAvailable ? "Yes" : "No"}
                </IonBadge>
              </div>
            </div>

            {systemInfo.availability?.reason && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <IonText color="warning">
                  <small>{systemInfo.availability.reason}</small>
                </IonText>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Operation Summary */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Operation Summary</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-2">
              {Object.entries(getOperationSummary()).map(
                ([operation, stats]) => (
                  <div
                    key={operation}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium">{operation}</span>
                    <div className="flex space-x-1">
                      <IonChip color="success" outline>
                        {stats.success}
                      </IonChip>
                      <IonChip color="danger" outline>
                        {stats.failed}
                      </IonChip>
                    </div>
                  </div>
                ),
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Controls */}
        <div className="p-4 space-y-2">
          <IonButton
            expand="block"
            fill="outline"
            onClick={refreshLogs}
            disabled={isRefreshing}
          >
            <IonIcon icon={refresh} slot="start" />
            Refresh Logs
          </IonButton>

          <div className="grid grid-cols-2 gap-2">
            <IonButton
              fill="outline"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <IonIcon icon={download} slot="start" />
              Export
            </IonButton>

            <IonButton
              fill="outline"
              color="danger"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              Clear Logs
            </IonButton>
          </div>
        </div>

        {/* Debug Logs */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Debug Logs ({logs.length})</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {logs.length === 0 ? (
              <IonText color="medium">
                <p>
                  No debug logs available. Perform biometric operations to see
                  logs here.
                </p>
              </IonText>
            ) : (
              <IonList>
                {logs
                  .slice()
                  .reverse()
                  .map((log, index) => (
                    <IonItem key={index} lines="full">
                      <IonIcon
                        icon={getLogIcon(log.success)}
                        color={getLogColor(log.success)}
                        slot="start"
                      />
                      <IonLabel>
                        <h3>
                          {log.operation}:{log.step}
                        </h3>
                        <p>{formatTimestamp(log.timestamp)}</p>
                        {log.data && (
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                          </div>
                        )}
                        {log.error && (
                          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <strong>Error:</strong> {log.error.message}
                            {log.error.code && (
                              <div>
                                <strong>Code:</strong> {log.error.code}
                              </div>
                            )}
                          </div>
                        )}
                      </IonLabel>
                    </IonItem>
                  ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default BiometricDebugPanel;
