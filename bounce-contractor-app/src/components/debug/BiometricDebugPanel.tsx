import React, { useState, useEffect } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonBadge,
  IonText,
  IonToggle,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonAccordion,
  IonAccordionGroup,
  IonChip,
} from "@ionic/react";
import {
  bugOutline,
  refreshOutline,
  downloadOutline,
  trashOutline,
  fingerPrintOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  warningOutline,
  informationCircleOutline,
  mailOutline,
} from "ionicons/icons";
import {
  biometricLogger,
  BiometricLogEntry,
} from "../../utils/biometricLogger";
import { useBiometric } from "../../hooks/auth/useBiometric";
import { BiometryType } from "../../types/biometric.types";
import { supportService } from "../../services/api/supportService";
import { useAuthStore, authSelectors } from "../../store/authStore";

interface BiometricDebugPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const BiometricDebugPanel: React.FC<BiometricDebugPanelProps> = ({
  isVisible = true,
  onClose,
}) => {
  const [logs, setLogs] = useState<BiometricLogEntry[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [isEmailingLogs, setIsEmailingLogs] = useState(false);

  const user = useAuthStore(authSelectors.user);

  const {
    isAvailable,
    isEnabled,
    isLoading,
    error,
    settings,
    availability,
    checkAvailability,
    authenticate,
    refresh,
  } = useBiometric();

  // Refresh logs periodically
  useEffect(() => {
    const refreshLogs = () => {
      setLogs(biometricLogger.getLogs());
    };

    refreshLogs();

    if (autoRefresh) {
      const interval = setInterval(refreshLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Handle debug mode toggle
  const handleDebugModeToggle = (enabled: boolean) => {
    setDebugMode(enabled);
    biometricLogger.setDebugMode(enabled);
  };

  // Test biometric authentication
  const testAuthentication = async () => {
    try {
      await authenticate({
        reason: "Debug test authentication",
        title: "Debug Test",
        subtitle: "Testing biometric authentication",
      });
    } catch (error) {
      console.error("Debug test failed:", error);
    }
  };

  // Export logs
  const exportLogs = () => {
    const logsJson = biometricLogger.exportLogs();
    const blob = new Blob([logsJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biometric-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear logs
  const clearLogs = () => {
    biometricLogger.clearLogs();
    setLogs([]);
  };

  // Email logs via support system
  const emailLogs = async () => {
    if (isEmailingLogs) return;

    setIsEmailingLogs(true);

    try {
      // Generate log summary
      const errorCount = logs.filter((l) => l.level === "error").length;
      const warnCount = logs.filter((l) => l.level === "warn").length;
      const totalLogs = logs.length;

      // Create formatted description
      const timestamp = new Date().toISOString();
      const userName = user
        ? `${user.firstName} ${user.lastName}`
        : "Unknown User";
      const userEmail = user?.email || "unknown@example.com";

      // Get only error and warning logs for JSON (to keep size manageable)
      const criticalLogs = logs.filter(
        (l) => l.level === "error" || l.level === "warn",
      );

      // Create base description
      let description = `BIOMETRIC DEBUG LOGS EXPORT

User: ${userName} (${userEmail})
Export Time: ${timestamp}
Total Logs: ${totalLogs} (${errorCount} errors, ${warnCount} warnings)

BIOMETRIC STATUS:
- Available: ${isAvailable ? "Yes" : "No"}
- Enabled: ${isEnabled ? "Yes" : "No"}
- Type: ${getBiometryTypeDisplay(availability?.biometryType)}
- Strong Biometry: ${availability?.strongBiometryIsAvailable ? "Yes" : "No"}
${availability?.reason ? `- Reason: ${availability.reason}` : ""}
${error ? `- Current Error: ${error}` : ""}

DEVICE INFO:
- Platform: ${navigator.platform}
- User Agent: ${navigator.userAgent.substring(0, 100)}...

RECENT LOG ENTRIES (Last 8):
${logs
  .slice(-8)
  .map(
    (log) =>
      `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()} - ${log.category}: ${log.message}`,
  )
  .join("\n")}`;

      // Add critical logs if any exist and we have space
      if (criticalLogs.length > 0) {
        const criticalLogsJson = JSON.stringify(
          criticalLogs.slice(-5),
          null,
          1,
        );
        const potentialDescription =
          description + `\n\nCRITICAL LOGS (JSON):\n${criticalLogsJson}`;

        // Only add if under 1900 characters (leaving buffer for API limit)
        if (potentialDescription.length < 1900) {
          description = potentialDescription;
        } else {
          description +=
            "\n\nCRITICAL LOGS: Too large for email - contact support for full logs";
        }
      } else {
        description += "\n\nNo critical errors found in logs.";
      }

      // Final safety check - truncate if still too long
      if (description.length > 1950) {
        description =
          description.substring(0, 1900) +
          "\n\n[TRUNCATED - Contact support for full logs]";
      }

      // Submit as bug report
      const response = await supportService.submitBugReport({
        title: `Biometric Debug Logs - ${new Date().toLocaleString()}`,
        description,
        category: "Login/Authentication",
        priority: "medium",
        stepsToReproduce: "N/A - Debug logs export from biometric debug panel",
        expectedBehavior: "Biometric authentication should work properly",
        actualBehavior:
          errorCount > 0
            ? `Found ${errorCount} errors and ${warnCount} warnings in biometric logs`
            : "No errors found - logs exported for analysis",
      });

      // Show success message
      console.log("Biometric logs emailed successfully!", response);
      alert(
        `Biometric logs sent successfully!\nReference ID: ${response.referenceId}`,
      );
    } catch (error) {
      console.error("Failed to email biometric logs:", error);
      alert("Failed to send biometric logs. Please try again.");
    } finally {
      setIsEmailingLogs(false);
    }
  };

  // Filter logs by level
  const filteredLogs =
    selectedLevel === "all"
      ? logs
      : logs.filter((log) => log.level === selectedLevel);

  // Get log level icon
  const getLogLevelIcon = (level: BiometricLogEntry["level"]) => {
    switch (level) {
      case "error":
        return closeCircleOutline;
      case "warn":
        return warningOutline;
      case "info":
        return informationCircleOutline;
      case "debug":
        return bugOutline;
      default:
        return informationCircleOutline;
    }
  };

  // Get log level color
  const getLogLevelColor = (level: BiometricLogEntry["level"]) => {
    switch (level) {
      case "error":
        return "danger";
      case "warn":
        return "warning";
      case "info":
        return "primary";
      case "debug":
        return "medium";
      default:
        return "medium";
    }
  };

  // Get biometry type display name
  const getBiometryTypeDisplay = (type?: BiometryType) => {
    switch (type) {
      case BiometryType.FINGERPRINT:
        return "Fingerprint";
      case BiometryType.FACE_ID:
        return "Face ID";
      case BiometryType.TOUCH_ID:
        return "Touch ID";
      case BiometryType.FACE_AUTHENTICATION:
        return "Face Authentication";
      case BiometryType.IRIS_AUTHENTICATION:
        return "Iris Authentication";
      case BiometryType.MULTIPLE:
        return "Multiple Types";
      default:
        return "None";
    }
  };

  if (!isVisible) return null;

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={fingerPrintOutline} /> Biometric Debug Panel
        </IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonAccordionGroup>
          {/* Status Overview */}
          <IonAccordion value="status">
            <IonItem slot="header">
              <IonLabel>Biometric Status</IonLabel>
            </IonItem>
            <div slot="content">
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonItem>
                      <IonLabel>
                        <h3>Available</h3>
                        <p>
                          <IonIcon
                            icon={
                              isAvailable
                                ? checkmarkCircleOutline
                                : closeCircleOutline
                            }
                            color={isAvailable ? "success" : "danger"}
                          />
                          {isAvailable ? "Yes" : "No"}
                        </p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem>
                      <IonLabel>
                        <h3>Enabled</h3>
                        <p>
                          <IonIcon
                            icon={
                              isEnabled
                                ? checkmarkCircleOutline
                                : closeCircleOutline
                            }
                            color={isEnabled ? "success" : "danger"}
                          />
                          {isEnabled ? "Yes" : "No"}
                        </p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="6">
                    <IonItem>
                      <IonLabel>
                        <h3>Type</h3>
                        <p>
                          {getBiometryTypeDisplay(availability?.biometryType)}
                        </p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem>
                      <IonLabel>
                        <h3>Strong Biometry</h3>
                        <p>
                          <IonIcon
                            icon={
                              availability?.strongBiometryIsAvailable
                                ? checkmarkCircleOutline
                                : closeCircleOutline
                            }
                            color={
                              availability?.strongBiometryIsAvailable
                                ? "success"
                                : "danger"
                            }
                          />
                          {availability?.strongBiometryIsAvailable
                            ? "Yes"
                            : "No"}
                        </p>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
                {availability?.reason && (
                  <IonRow>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Reason</h3>
                          <p>{availability.reason}</p>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                )}
                {error && (
                  <IonRow>
                    <IonCol size="12">
                      <IonItem color="danger">
                        <IonLabel>
                          <h3>Current Error</h3>
                          <p>{error}</p>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                )}
              </IonGrid>
            </div>
          </IonAccordion>

          {/* Settings */}
          <IonAccordion value="settings">
            <IonItem slot="header">
              <IonLabel>Settings & Controls</IonLabel>
            </IonItem>
            <div slot="content">
              <IonList>
                <IonItem>
                  <IonLabel>Debug Mode</IonLabel>
                  <IonToggle
                    checked={debugMode}
                    onIonChange={(e) => handleDebugModeToggle(e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Auto Refresh Logs</IonLabel>
                  <IonToggle
                    checked={autoRefresh}
                    onIonChange={(e) => setAutoRefresh(e.detail.checked)}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Log Level Filter</IonLabel>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    style={{ marginLeft: "10px" }}
                  >
                    <option value="all">All</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </IonItem>
              </IonList>

              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={testAuthentication}
                      disabled={isLoading || !isAvailable}
                    >
                      <IonIcon icon={fingerPrintOutline} slot="start" />
                      Test Auth
                    </IonButton>
                  </IonCol>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={refresh}
                      disabled={isLoading}
                    >
                      <IonIcon icon={refreshOutline} slot="start" />
                      Refresh
                    </IonButton>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={emailLogs}
                      disabled={isEmailingLogs}
                      color="primary"
                    >
                      <IonIcon icon={mailOutline} slot="start" />
                      {isEmailingLogs ? "Sending..." : "Email Logs"}
                    </IonButton>
                  </IonCol>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill="outline"
                      color="danger"
                      onClick={clearLogs}
                    >
                      <IonIcon icon={trashOutline} slot="start" />
                      Clear
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          </IonAccordion>

          {/* Logs */}
          <IonAccordion value="logs">
            <IonItem slot="header">
              <IonLabel>
                Logs ({filteredLogs.length})
                {logs.length > 0 && (
                  <IonBadge color="primary" style={{ marginLeft: "10px" }}>
                    {logs.filter((l) => l.level === "error").length} errors
                  </IonBadge>
                )}
              </IonLabel>
            </IonItem>
            <div slot="content">
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {filteredLogs.length === 0 ? (
                  <IonItem>
                    <IonLabel>No logs available</IonLabel>
                  </IonItem>
                ) : (
                  filteredLogs
                    .slice(-50)
                    .reverse()
                    .map((log, index) => (
                      <IonItem key={index}>
                        <IonIcon
                          icon={getLogLevelIcon(log.level)}
                          color={getLogLevelColor(log.level)}
                          slot="start"
                        />
                        <IonLabel>
                          <h3>
                            <IonChip color={getLogLevelColor(log.level)}>
                              {log.level.toUpperCase()}
                            </IonChip>
                            <IonChip color="medium">{log.category}</IonChip>
                          </h3>
                          <p>{log.message}</p>
                          <p>
                            <IonText color="medium">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </IonText>
                          </p>
                          {log.data && (
                            <IonTextarea
                              readonly
                              value={JSON.stringify(log.data, null, 2)}
                              rows={3}
                              style={{
                                fontSize: "12px",
                                fontFamily: "monospace",
                              }}
                            />
                          )}
                        </IonLabel>
                      </IonItem>
                    ))
                )}
              </div>
            </div>
          </IonAccordion>
        </IonAccordionGroup>
      </IonCardContent>
    </IonCard>
  );
};

export default BiometricDebugPanel;
