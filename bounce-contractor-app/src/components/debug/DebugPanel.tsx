import React, { useState, useEffect } from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonBadge,
  IonTextarea,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonAccordion,
  IonAccordionGroup,
  IonChip,
} from "@ionic/react";
import {
  bugOutline,
  downloadOutline,
  trashOutline,
  refreshOutline,
  informationCircleOutline,
  warningOutline,
  closeCircleOutline,
  eyeOutline,
} from "ionicons/icons";
import { errorLogger, ErrorLog } from "../../services/debug/errorLogger";

interface DebugPanelProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  isVisible = false,
  onToggle,
}) => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ErrorLog[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  useEffect(() => {
    // Initial load
    setLogs(errorLogger.getLogs());

    // Subscribe to new logs
    const unsubscribe = errorLogger.onLog((newLog) => {
      setLogs((prev) => [newLog, ...prev]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Filter logs based on selected criteria
    let filtered = logs;

    if (selectedLevel !== "all") {
      filtered = filtered.filter((log) => log.level === selectedLevel);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((log) => log.category === selectedCategory);
    }

    setFilteredLogs(filtered);
  }, [logs, selectedLevel, selectedCategory]);

  const handleClearLogs = () => {
    errorLogger.clearLogs();
    setLogs([]);
  };

  const handleExportLogs = () => {
    const logsData = errorLogger.exportLogs();
    const systemInfo = errorLogger.getSystemInfo();

    const exportData = {
      timestamp: new Date().toISOString(),
      systemInfo,
      logs: logs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (level: ErrorLog["level"]) => {
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

  const getLogColor = (level: ErrorLog["level"]) => {
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

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(logs.map((log) => log.category))];
    return categories.sort();
  };

  const systemInfo = errorLogger.getSystemInfo();

  if (!isVisible) {
    return (
      <IonButton
        fill="clear"
        size="small"
        onClick={() => onToggle?.(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        <IonIcon icon={bugOutline} />
      </IonButton>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        width: "400px",
        maxHeight: "80vh",
        zIndex: 1000,
        backgroundColor: "var(--ion-background-color)",
        border: "1px solid var(--ion-border-color)",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}
    >
      <IonCard style={{ margin: 0, height: "100%" }}>
        <IonCardHeader>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <IonCardTitle style={{ fontSize: "1rem" }}>
              <IonIcon icon={bugOutline} style={{ marginRight: "8px" }} />
              Debug Panel
            </IonCardTitle>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => onToggle?.(false)}
            >
              <IonIcon icon={eyeOutline} />
            </IonButton>
          </div>
        </IonCardHeader>

        <IonCardContent
          style={{
            padding: "8px",
            height: "calc(100% - 60px)",
            overflow: "auto",
          }}
        >
          {/* Controls */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <IonSelect
                value={selectedLevel}
                placeholder="Level"
                onIonChange={(e) => setSelectedLevel(e.detail.value)}
                style={{ flex: 1 }}
              >
                <IonSelectOption value="all">All Levels</IonSelectOption>
                <IonSelectOption value="error">Errors</IonSelectOption>
                <IonSelectOption value="warn">Warnings</IonSelectOption>
                <IonSelectOption value="info">Info</IonSelectOption>
                <IonSelectOption value="debug">Debug</IonSelectOption>
              </IonSelect>

              <IonSelect
                value={selectedCategory}
                placeholder="Category"
                onIonChange={(e) => setSelectedCategory(e.detail.value)}
                style={{ flex: 1 }}
              >
                <IonSelectOption value="all">All Categories</IonSelectOption>
                {getUniqueCategories().map((category) => (
                  <IonSelectOption key={category} value={category}>
                    {category}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              <IonButton size="small" fill="outline" onClick={handleClearLogs}>
                <IonIcon icon={trashOutline} slot="start" />
                Clear
              </IonButton>
              <IonButton size="small" fill="outline" onClick={handleExportLogs}>
                <IonIcon icon={downloadOutline} slot="start" />
                Export
              </IonButton>
              <IonButton
                size="small"
                fill="outline"
                onClick={() => setLogs(errorLogger.getLogs())}
              >
                <IonIcon icon={refreshOutline} slot="start" />
                Refresh
              </IonButton>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <IonChip color="danger">
              <IonLabel>
                Errors: {logs.filter((l) => l.level === "error").length}
              </IonLabel>
            </IonChip>
            <IonChip color="warning">
              <IonLabel>
                Warnings: {logs.filter((l) => l.level === "warn").length}
              </IonLabel>
            </IonChip>
            <IonChip color="primary">
              <IonLabel>
                Info: {logs.filter((l) => l.level === "info").length}
              </IonLabel>
            </IonChip>
            <IonChip color="medium">
              <IonLabel>
                Debug: {logs.filter((l) => l.level === "debug").length}
              </IonLabel>
            </IonChip>
          </div>

          {/* System Info Accordion */}
          <IonAccordionGroup style={{ marginBottom: "12px" }}>
            <IonAccordion value="system-info">
              <IonItem slot="header">
                <IonLabel>System Information</IonLabel>
              </IonItem>
              <div slot="content" style={{ padding: "8px" }}>
                <IonTextarea
                  readonly
                  value={JSON.stringify(systemInfo, null, 2)}
                  rows={8}
                  style={{ fontSize: "10px", fontFamily: "monospace" }}
                />
              </div>
            </IonAccordion>
          </IonAccordionGroup>

          {/* Logs List */}
          <IonList style={{ maxHeight: "300px", overflow: "auto" }}>
            {filteredLogs.length === 0 ? (
              <IonItem>
                <IonLabel>
                  <p>No logs to display</p>
                </IonLabel>
              </IonItem>
            ) : (
              filteredLogs.map((log) => (
                <IonAccordionGroup key={log.id}>
                  <IonAccordion value={log.id}>
                    <IonItem slot="header">
                      <IonIcon
                        icon={getLogIcon(log.level)}
                        color={getLogColor(log.level)}
                        style={{ marginRight: "8px" }}
                      />
                      <IonLabel>
                        <h3 style={{ fontSize: "12px" }}>{log.message}</h3>
                        <p style={{ fontSize: "10px" }}>
                          {formatTimestamp(log.timestamp)} | {log.category}
                        </p>
                      </IonLabel>
                      <IonBadge color={getLogColor(log.level)} slot="end">
                        {log.level}
                      </IonBadge>
                    </IonItem>
                    <div slot="content" style={{ padding: "8px" }}>
                      {log.error && (
                        <div style={{ marginBottom: "8px" }}>
                          <IonNote color="danger">
                            <strong>Error:</strong> {log.error.message}
                          </IonNote>
                        </div>
                      )}
                      {log.stack && (
                        <div style={{ marginBottom: "8px" }}>
                          <IonNote>
                            <strong>Stack:</strong>
                          </IonNote>
                          <IonTextarea
                            readonly
                            value={log.stack}
                            rows={4}
                            style={{ fontSize: "9px", fontFamily: "monospace" }}
                          />
                        </div>
                      )}
                      {log.context && (
                        <div>
                          <IonNote>
                            <strong>Context:</strong>
                          </IonNote>
                          <IonTextarea
                            readonly
                            value={JSON.stringify(log.context, null, 2)}
                            rows={6}
                            style={{ fontSize: "9px", fontFamily: "monospace" }}
                          />
                        </div>
                      )}
                    </div>
                  </IonAccordion>
                </IonAccordionGroup>
              ))
            )}
          </IonList>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default DebugPanel;
