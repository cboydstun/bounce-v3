import React from "react";
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonChip,
  IonLabel,
  IonProgressBar,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import {
  cloudOfflineOutline,
  cloudDoneOutline,
  syncOutline,
  warningOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";
import { useNetwork } from "../../hooks/common/useNetwork";
import { useOfflineQueue } from "../../hooks/common/useOfflineQueue";

interface OfflineBannerProps {
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ className }) => {
  const { isOnline, isOffline, connectionType } = useNetwork();
  const {
    queueStatus,
    conflicts,
    isProcessing,
    lastSyncResult,
    processQueue,
    retryFailedActions,
    clearFailedActions,
  } = useOfflineQueue();

  const handleRetrySync = async () => {
    try {
      await processQueue();
    } catch (error) {
      console.error("Failed to retry sync:", error);
    }
  };

  const handleRetryFailed = async () => {
    try {
      await retryFailedActions();
    } catch (error) {
      console.error("Failed to retry failed actions:", error);
    }
  };

  const handleClearFailed = async () => {
    try {
      await clearFailedActions();
    } catch (error) {
      console.error("Failed to clear failed actions:", error);
    }
  };

  // Don't show banner if online and no pending actions
  if (isOnline && queueStatus.total === 0 && conflicts.length === 0) {
    return null;
  }

  const getBannerColor = () => {
    if (isOffline) return "danger";
    if (conflicts.length > 0) return "warning";
    if (queueStatus.failed > 0) return "warning";
    if (queueStatus.pending > 0 || isProcessing) return "primary";
    return "success";
  };

  const getBannerMessage = () => {
    if (isOffline) {
      return `You're offline. ${queueStatus.pending} actions will sync when connection is restored.`;
    }

    if (conflicts.length > 0) {
      return `${conflicts.length} sync conflicts need resolution.`;
    }

    if (isProcessing) {
      return "Syncing offline actions...";
    }

    if (queueStatus.failed > 0) {
      return `${queueStatus.failed} actions failed to sync.`;
    }

    if (queueStatus.pending > 0) {
      return `${queueStatus.pending} actions pending sync.`;
    }

    if (lastSyncResult && lastSyncResult.successful > 0) {
      return `Successfully synced ${lastSyncResult.successful} actions.`;
    }

    return "All actions synced successfully.";
  };

  const getBannerIcon = () => {
    if (isOffline) return cloudOfflineOutline;
    if (conflicts.length > 0) return warningOutline;
    if (queueStatus.failed > 0) return closeCircleOutline;
    if (isProcessing) return syncOutline;
    if (queueStatus.pending > 0) return syncOutline;
    return checkmarkCircleOutline;
  };

  const bannerColor = getBannerColor();
  const bannerColorClass =
    {
      danger: "bg-red-100 border-red-300 text-red-800",
      warning: "bg-yellow-100 border-yellow-300 text-yellow-800",
      primary: "bg-blue-100 border-blue-300 text-blue-800",
      success: "bg-green-100 border-green-300 text-green-800",
    }[bannerColor] || "bg-gray-100 border-gray-300 text-gray-800";

  return (
    <div className={className}>
      <div className={`border-l-4 p-4 ${bannerColorClass}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <IonIcon icon={getBannerIcon()} className="text-lg" />
            <div className="flex-1">
              <p className="text-sm font-medium">{getBannerMessage()}</p>

              {/* Connection type indicator */}
              {isOnline && (
                <div className="flex items-center space-x-2 mt-1">
                  <IonChip color="light">
                    <IonLabel className="text-xs capitalize">
                      {connectionType}
                    </IonLabel>
                  </IonChip>
                  {queueStatus.total > 0 && (
                    <IonChip color="light">
                      <IonLabel className="text-xs">
                        {queueStatus.pending}P {queueStatus.processing}S{" "}
                        {queueStatus.failed}F
                      </IonLabel>
                    </IonChip>
                  )}
                </div>
              )}

              {/* Sync progress bar */}
              {isProcessing && (
                <IonProgressBar type="indeterminate" className="mt-2" />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {isProcessing && <IonSpinner name="crescent" className="w-4 h-4" />}

            {/* Retry sync button */}
            {isOnline && queueStatus.pending > 0 && !isProcessing && (
              <IonButton
                size="small"
                fill="clear"
                onClick={handleRetrySync}
                className="text-xs"
              >
                <IonIcon icon={syncOutline} slot="start" />
                Sync
              </IonButton>
            )}

            {/* Retry failed actions */}
            {isOnline && queueStatus.failed > 0 && (
              <IonButton
                size="small"
                fill="clear"
                onClick={handleRetryFailed}
                className="text-xs"
              >
                Retry
              </IonButton>
            )}

            {/* Clear failed actions */}
            {queueStatus.failed > 0 && (
              <IonButton
                size="small"
                fill="clear"
                onClick={handleClearFailed}
                className="text-xs"
              >
                Clear
              </IonButton>
            )}
          </div>
        </div>
      </div>

      {/* Detailed sync status */}
      {(queueStatus.total > 0 || conflicts.length > 0) && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <div className="flex space-x-4">
              {queueStatus.pending > 0 && (
                <span>📋 {queueStatus.pending} pending</span>
              )}
              {queueStatus.processing > 0 && (
                <span>⚡ {queueStatus.processing} syncing</span>
              )}
              {queueStatus.failed > 0 && (
                <span>❌ {queueStatus.failed} failed</span>
              )}
              {conflicts.length > 0 && (
                <span>⚠️ {conflicts.length} conflicts</span>
              )}
            </div>

            {lastSyncResult && (
              <span className="text-gray-500">
                Last sync: {lastSyncResult.successful}✓ {lastSyncResult.failed}✗
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineBanner;
