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

  const testCredentialStorage = async () => {
    try {
      console.log("=== MANUAL CREDENTIAL STORAGE TEST ===");

      // Test credentials
      const testCredentials = {
        username: "test@example.com",
        password: "testpassword123",
      };

      console.log("1. Testing credential storage...");
      await secureStorage.storeBiometricCredentials(testCredentials);
      console.log("✓ Storage completed");

      console.log("2. Testing credential retrieval...");
      const retrieved = await secureStorage.getBiometricCredentials();
      console.log("Retrieved:", retrieved);

      if (retrieved) {
        console.log("✓ SUCCESS: Credentials stored and retrieved successfully");
      } else {
        console.log("✗ FAILED: Credentials not retrieved");
      }

      // Clean up test
      console.log("3. Cleaning up test credentials...");
      await secureStorage.removeBiometricCredentials();
      console.log("✓ Cleanup completed");

      // Refresh the debug panel
      await refreshLogs();
    } catch (error) {
      console.error("✗ STORAGE TEST FAILED:", error);
    }
  };

  const testBiometricSetup = async () => {
    try {
      console.log("=== MANUAL BIOMETRIC SETUP TEST ===");

      const testCredentials = {
        username: "test@example.com",
        password: "testpassword123",
      };

      console.log("Testing full biometric setup...");
      const result = await biometricService.setupBiometric(testCredentials);
      console.log("Setup result:", result);

      if (result.success) {
        console.log("✓ SUCCESS: Biometric setup completed");

        // Test retrieval
        const retrieved = await secureStorage.getBiometricCredentials();
        console.log("Retrieved after setup:", retrieved);
      } else {
        console.log("✗ FAILED: Biometric setup failed:", result.error);
      }

      // Refresh the debug panel
      await refreshLogs();
    } catch (error) {
      console.error("✗ SETUP TEST FAILED:", error);
    }
  };

  const clearBiometricStorage = async () => {
    console.log("=== CLEARING BIOMETRIC STORAGE ===");

    let credentialsCleared = false;
    let settingsCleared = false;
    let errors: string[] = [];

    try {
      // Check what's currently stored
      console.log("0. Inspecting current storage state...");
      let currentCredentials = null;
      let currentSettings = null;

      try {
        currentCredentials = await secureStorage.getBiometricCredentials();
        console.log("Current credentials:", currentCredentials);
      } catch (error) {
        console.warn("Could not read current credentials:", error);
        errors.push("Could not read current credentials");
      }

      try {
        currentSettings = await secureStorage.getBiometricSettings();
        console.log("Current settings:", currentSettings);
      } catch (error) {
        console.warn("Could not read current settings:", error);
        errors.push("Could not read current settings");
      }

      // Step 1: Clear biometric credentials with individual error handling
      console.log("1. Clearing biometric credentials...");
      try {
        await secureStorage.removeBiometricCredentials();
        console.log("✓ Credentials removal completed");
        credentialsCleared = true;
      } catch (credError: any) {
        console.error("✗ Failed to remove credentials:", credError);
        errors.push(
          `Credential removal failed: ${credError.message || credError}`,
        );

        // Try alternative cleanup methods
        console.log("1a. Trying alternative credential cleanup...");
        try {
          // Try to clear the storage key directly
          const key = "biometric_credentials"; // Default key
          await secureStorage.removeItem(key);
          console.log("✓ Alternative credential cleanup succeeded");
          credentialsCleared = true;
        } catch (altError: any) {
          console.error(
            "✗ Alternative credential cleanup also failed:",
            altError,
          );
          errors.push(
            `Alternative credential cleanup failed: ${altError.message || altError}`,
          );
        }
      }

      // Step 2: Clear biometric settings with individual error handling
      console.log("2. Clearing biometric settings...");
      try {
        // First try the service method
        await biometricService.disableBiometric();
        console.log("✓ Biometric service disable completed");
        settingsCleared = true;
      } catch (serviceError: any) {
        console.error("✗ Biometric service disable failed:", serviceError);
        errors.push(
          `Service disable failed: ${serviceError.message || serviceError}`,
        );

        // Try direct settings cleanup
        console.log("2a. Trying direct settings cleanup...");
        try {
          const settingsKey = "biometric_settings"; // Default key
          await secureStorage.removeItem(settingsKey);
          console.log("✓ Direct settings cleanup succeeded");
          settingsCleared = true;
        } catch (directError: any) {
          console.error("✗ Direct settings cleanup failed:", directError);
          errors.push(
            `Direct settings cleanup failed: ${directError.message || directError}`,
          );

          // Try to at least set settings to disabled
          console.log("2b. Trying to set settings to disabled...");
          try {
            await secureStorage.storeBiometricSettings({ enabled: false });
            console.log("✓ Settings set to disabled");
            settingsCleared = true;
          } catch (disableError: any) {
            console.error("✗ Could not even disable settings:", disableError);
            errors.push(
              `Could not disable settings: ${disableError.message || disableError}`,
            );
          }
        }
      }

      // Step 3: Try to clear any web fallback storage
      console.log("3. Clearing web fallback storage...");
      try {
        // Clear localStorage items that might be related
        const keysToRemove = [
          "secure_biometric_credentials",
          "secure_biometric_settings",
          "biometric_credentials",
          "biometric_settings",
        ];

        keysToRemove.forEach((key) => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`✓ Removed localStorage key: ${key}`);
          }
        });
      } catch (localStorageError: any) {
        console.warn("Could not clear localStorage:", localStorageError);
        errors.push(
          `localStorage cleanup failed: ${localStorageError.message || localStorageError}`,
        );
      }

      // Step 4: Verify cleanup
      console.log("4. Verifying cleanup...");
      let verifyCredentials = null;
      let verifySettings = null;

      try {
        verifyCredentials = await secureStorage.getBiometricCredentials();
        console.log("After cleanup - credentials:", verifyCredentials);
      } catch (error: any) {
        console.log(
          "After cleanup - could not read credentials (this might be good):",
          error.message || error,
        );
      }

      try {
        verifySettings = await secureStorage.getBiometricSettings();
        console.log("After cleanup - settings:", verifySettings);
      } catch (error: any) {
        console.log(
          "After cleanup - could not read settings (this might be good):",
          error.message || error,
        );
      }

      // Determine success level
      const credentialsGone = !verifyCredentials;
      const settingsDisabled = !verifySettings || !verifySettings.enabled;

      if (credentialsGone && settingsDisabled) {
        console.log("✓ SUCCESS: Biometric storage completely cleared");
        alert(
          "✓ Biometric storage cleared successfully! The dummy credentials have been removed.",
        );
      } else if (credentialsCleared || settingsCleared) {
        console.log(
          "⚠ PARTIAL SUCCESS: Some cleanup completed but verification shows remaining data",
        );
        alert(
          `⚠ Partial success: ${credentialsCleared ? "Credentials cleared" : "Credentials may remain"}, ${settingsCleared ? "Settings cleared" : "Settings may remain"}. Check console for details.`,
        );
      } else {
        console.log("✗ CLEANUP FAILED: No operations succeeded");
        alert(
          `✗ Cleanup failed. Errors: ${errors.join(", ")}. Check console for details.`,
        );
      }

      // Always refresh the debug panel
      await refreshLogs();
    } catch (error: any) {
      console.error("✗ UNEXPECTED ERROR during cleanup:", error);
      alert(
        `✗ Unexpected error during cleanup: ${error.message || error}. Check console for details.`,
      );
    }

    // Summary
    console.log("=== CLEANUP SUMMARY ===");
    console.log(`Credentials cleared: ${credentialsCleared}`);
    console.log(`Settings cleared: ${settingsCleared}`);
    console.log(`Errors encountered: ${errors.length}`);
    if (errors.length > 0) {
      console.log("Errors:", errors);
    }
  };

  const inspectStoredCredentials = async () => {
    try {
      console.log("=== INSPECTING STORED CREDENTIALS ===");

      const credentials = await secureStorage.getBiometricCredentials();
      const settings = await secureStorage.getBiometricSettings();

      console.log("Stored credentials:", credentials);
      console.log("Stored settings:", settings);

      if (credentials) {
        console.log("Credential details:");
        console.log("- Username:", credentials.username);
        console.log("- Password length:", credentials.password?.length || 0);
        console.log("- Has access token:", !!credentials.accessToken);
        console.log("- Has refresh token:", !!credentials.refreshToken);

        // Check if these are dummy/test credentials
        if (credentials.username === "test@example.com") {
          console.log(
            "🚨 FOUND DUMMY CREDENTIALS! These are test credentials that should be cleared.",
          );
          alert(
            "🚨 Found dummy test credentials (test@example.com)! Use 'Clear Biometric Storage' to remove them.",
          );
        } else {
          console.log("✓ Credentials appear to be real user credentials");
        }
      } else {
        console.log("✓ No credentials stored");
      }

      // Refresh the debug panel
      await refreshLogs();
    } catch (error) {
      console.error("✗ INSPECTION FAILED:", error);
    }
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

          {/* Test Functions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Manual Tests
            </h4>
            <div className="space-y-2">
              <IonButton
                expand="block"
                fill="outline"
                color="primary"
                onClick={inspectStoredCredentials}
              >
                <IonIcon icon={informationCircle} slot="start" />
                Inspect Stored Credentials
              </IonButton>

              <IonButton
                expand="block"
                fill="outline"
                color="danger"
                onClick={clearBiometricStorage}
              >
                <IonIcon icon={warningOutline} slot="start" />
                Clear Biometric Storage
              </IonButton>

              <IonButton
                expand="block"
                fill="outline"
                color="warning"
                onClick={testCredentialStorage}
              >
                Test Credential Storage
              </IonButton>

              <IonButton
                expand="block"
                fill="outline"
                color="secondary"
                onClick={testBiometricSetup}
              >
                Test Biometric Setup
              </IonButton>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Check browser console for detailed test results
            </p>
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
