import React, { useState } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonBadge,
  IonButton,
  IonText,
  IonItem,
  IonLabel,
  IonList,
  IonCheckbox,
  IonProgressBar,
  IonChip,
  IonAccordion,
  IonAccordionGroup,
} from "@ionic/react";
import {
  carOutline,
  timeOutline,
  locationOutline,
  cubeOutline,
  navigateOutline,
  checkmarkCircleOutline,
  ellipseOutline,
  mapOutline,
  listOutline,
  statsChartOutline,
  personOutline,
  callOutline,
  mailOutline,
  cashOutline,
  informationCircleOutline,
  homeOutline,
  businessOutline,
  alertCircleOutline,
  documentTextOutline,
  cameraOutline,
} from "ionicons/icons";
import {
  DeliveryItem,
  DeliveryStop,
  RouteMetadata,
  getRouteProgress,
  getNextStop,
} from "../../utils/consolidatedTaskParser";

interface RouteOverviewCardProps {
  metadata: RouteMetadata;
  paymentAmount?: number;
  progress?: { completed: number; remaining: number; percentage: number };
}

export const RouteOverviewCard: React.FC<RouteOverviewCardProps> = ({
  metadata,
  paymentAmount,
  progress,
}) => {
  return (
    <IonCard className="route-overview-card">
      <IonCardHeader>
        <IonCardTitle className="flex items-center gap-2">
          <IonIcon icon={carOutline} className="text-blue-500" />
          Delivery Route Overview
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metadata.totalStops}
            </div>
            <div className="text-sm text-gray-600">Total Stops</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${paymentAmount?.toFixed(2) || "0.00"}
            </div>
            <div className="text-sm text-gray-600">Total Payment</div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <IonIcon icon={mapOutline} className="text-orange-500" />
            <span className="text-sm">Distance: {metadata.totalDistance}</span>
          </div>
          <div className="flex items-center gap-2">
            <IonIcon icon={timeOutline} className="text-purple-500" />
            <span className="text-sm">Duration: {metadata.totalDuration}</span>
          </div>
          {metadata.startTime && metadata.endTime && (
            <div className="flex items-center gap-2">
              <IonIcon icon={timeOutline} className="text-indigo-500" />
              <span className="text-sm">
                {metadata.startTime} - {metadata.endTime}
              </span>
            </div>
          )}
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress.percentage}%</span>
            </div>
            <IonProgressBar value={progress.percentage / 100} />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{progress.completed} completed</span>
              <span>{progress.remaining} remaining</span>
            </div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

interface ItemsListCardProps {
  items: DeliveryItem[];
  completedItems?: string[]; // Array of "orderNumber-itemName" strings
  onItemToggle?: (itemKey: string, completed: boolean) => void;
  readonly?: boolean;
}

export const ItemsListCard: React.FC<ItemsListCardProps> = ({
  items,
  completedItems = [],
  onItemToggle,
  readonly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayItems = isExpanded ? items : items.slice(0, 3);

  return (
    <IonCard className="items-list-card">
      <IonCardHeader>
        <IonCardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IonIcon icon={cubeOutline} className="text-green-500" />
            Items to Deliver ({items.length})
          </div>
          {items.length > 3 && (
            <IonButton
              fill="clear"
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Show All"}
            </IonButton>
          )}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>
          {displayItems.map((item, index) => {
            const itemKey = `${item.orderNumber}-${item.name}`;
            const isCompleted = completedItems.includes(itemKey);

            return (
              <IonItem key={index} className={isCompleted ? "opacity-60" : ""}>
                {!readonly && onItemToggle && (
                  <IonCheckbox
                    slot="start"
                    checked={isCompleted}
                    onIonChange={(e) => onItemToggle(itemKey, e.detail.checked)}
                  />
                )}
                <IonLabel>
                  <h3 className={isCompleted ? "line-through" : ""}>
                    {item.quantity}x {item.name}
                  </h3>
                  <p>Order: {item.orderNumber}</p>
                </IonLabel>
                {isCompleted && (
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    slot="end"
                    className="text-green-500"
                  />
                )}
              </IonItem>
            );
          })}
        </IonList>
      </IonCardContent>
    </IonCard>
  );
};

interface DeliveryScheduleCardProps {
  deliverySchedule: DeliveryStop[];
  completedStops?: number[];
  currentStop?: number;
  onNavigateToStop?: (stop: DeliveryStop) => void;
  onMarkStopComplete?: (stopNumber: number) => void;
  readonly?: boolean;
}

export const DeliveryScheduleCard: React.FC<DeliveryScheduleCardProps> = ({
  deliverySchedule,
  completedStops = [],
  currentStop,
  onNavigateToStop,
  onMarkStopComplete,
  readonly = false,
}) => {
  return (
    <IonCard className="delivery-schedule-card">
      <IonCardHeader>
        <IonCardTitle className="flex items-center gap-2">
          <IonIcon icon={locationOutline} className="text-blue-500" />
          Delivery Schedule
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonAccordionGroup>
          {deliverySchedule.map((stop) => {
            const isCompleted = completedStops.includes(stop.stopNumber);
            const isCurrent = currentStop === stop.stopNumber;

            return (
              <IonAccordion
                key={stop.stopNumber}
                value={`stop-${stop.stopNumber}`}
              >
                <IonItem slot="header">
                  <IonIcon
                    icon={isCompleted ? checkmarkCircleOutline : ellipseOutline}
                    slot="start"
                    className={
                      isCompleted
                        ? "text-green-500"
                        : isCurrent
                          ? "text-blue-500"
                          : "text-gray-400"
                    }
                  />
                  <IonLabel>
                    <h3
                      className={isCompleted ? "line-through opacity-60" : ""}
                    >
                      Stop {stop.stopNumber} - {stop.estimatedTime}
                    </h3>
                    <p className={isCompleted ? "line-through opacity-60" : ""}>
                      {stop.customerName}
                    </p>
                  </IonLabel>
                  {isCurrent && (
                    <IonBadge color="primary" slot="end">
                      Current
                    </IonBadge>
                  )}
                  {isCompleted && (
                    <IonBadge color="success" slot="end">
                      Complete
                    </IonBadge>
                  )}
                </IonItem>

                <div slot="content" className="p-4">
                  <div className="space-y-3">
                    <div>
                      <IonText className="font-medium">Address:</IonText>
                      <IonText className="block text-sm text-gray-600 mt-1">
                        {stop.address}
                      </IonText>
                    </div>

                    <div>
                      <IonText className="font-medium">Customer:</IonText>
                      <IonText className="block text-sm text-gray-600 mt-1">
                        {stop.customerName} (Order: {stop.orderNumber})
                      </IonText>
                    </div>

                    <div>
                      <IonText className="font-medium">Items:</IonText>
                      <IonText className="block text-sm text-gray-600 mt-1">
                        {stop.items}
                      </IonText>
                    </div>

                    {!readonly && (
                      <div className="flex gap-2 mt-4">
                        {onNavigateToStop && (
                          <IonButton
                            size="small"
                            fill="outline"
                            onClick={() => onNavigateToStop(stop)}
                          >
                            <IonIcon icon={navigateOutline} slot="start" />
                            Navigate
                          </IonButton>
                        )}
                        {!isCompleted && onMarkStopComplete && (
                          <IonButton
                            size="small"
                            color="success"
                            onClick={() => onMarkStopComplete(stop.stopNumber)}
                          >
                            <IonIcon
                              icon={checkmarkCircleOutline}
                              slot="start"
                            />
                            Mark Complete
                          </IonButton>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </IonAccordion>
            );
          })}
        </IonAccordionGroup>
      </IonCardContent>
    </IonCard>
  );
};

interface NextStopCardProps {
  nextStop: DeliveryStop | null;
  onNavigate?: () => void;
  onMarkComplete?: () => void;
}

export const NextStopCard: React.FC<NextStopCardProps> = ({
  nextStop,
  onNavigate,
  onMarkComplete,
}) => {
  if (!nextStop) {
    return (
      <IonCard className="next-stop-card">
        <IonCardContent className="text-center py-8">
          <IonIcon
            icon={checkmarkCircleOutline}
            className="text-green-500 text-4xl mb-2"
          />
          <IonText className="text-lg font-medium text-green-600">
            All stops completed!
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="next-stop-card border-l-4 border-blue-500">
      <IonCardHeader>
        <IonCardTitle className="flex items-center gap-2">
          <IonIcon icon={locationOutline} className="text-blue-500" />
          Next Stop
          <IonBadge color="primary">Stop {nextStop.stopNumber}</IonBadge>
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="space-y-3">
          <div>
            <IonText className="font-medium">Customer:</IonText>
            <IonText className="block text-gray-600">
              {nextStop.customerName}
            </IonText>
          </div>

          <div>
            <IonText className="font-medium">Address:</IonText>
            <IonText className="block text-gray-600">
              {nextStop.address}
            </IonText>
          </div>

          <div>
            <IonText className="font-medium">Estimated Time:</IonText>
            <IonText className="block text-gray-600">
              {nextStop.estimatedTime}
            </IonText>
          </div>

          <div>
            <IonText className="font-medium">Items:</IonText>
            <IonText className="block text-gray-600">{nextStop.items}</IonText>
          </div>

          <div className="flex gap-2 mt-4">
            {onNavigate && (
              <IonButton expand="block" onClick={onNavigate}>
                <IonIcon icon={navigateOutline} slot="start" />
                Navigate to Stop
              </IonButton>
            )}
            {onMarkComplete && (
              <IonButton
                expand="block"
                color="success"
                fill="outline"
                onClick={onMarkComplete}
              >
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Mark Complete
              </IonButton>
            )}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

interface RouteStatsCardProps {
  metadata: RouteMetadata;
  progress: { completed: number; remaining: number; percentage: number };
  startTime?: string;
  estimatedCompletion?: string;
}

export const RouteStatsCard: React.FC<RouteStatsCardProps> = ({
  metadata,
  progress,
  startTime,
  estimatedCompletion,
}) => {
  return (
    <IonCard className="route-stats-card">
      <IonCardHeader>
        <IonCardTitle className="flex items-center gap-2">
          <IonIcon icon={statsChartOutline} className="text-purple-500" />
          Route Statistics
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {progress.completed}/{metadata.totalStops}
            </div>
            <div className="text-xs text-gray-600">Stops Complete</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {progress.percentage}%
            </div>
            <div className="text-xs text-gray-600">Progress</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-sm font-bold text-orange-600">
              {metadata.totalDistance}
            </div>
            <div className="text-xs text-gray-600">Total Distance</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-sm font-bold text-purple-600">
              {metadata.totalDuration}
            </div>
            <div className="text-xs text-gray-600">Est. Duration</div>
          </div>
        </div>

        {(startTime || estimatedCompletion) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {startTime && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Started:</span>
                <span className="font-medium">{startTime}</span>
              </div>
            )}
            {estimatedCompletion && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Est. Completion:</span>
                <span className="font-medium">{estimatedCompletion}</span>
              </div>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

// NEW: Enhanced Detailed Stop Card Component
interface DetailedStopCardProps {
  stop: DeliveryStop;
  stopIndex: number;
  isCompleted?: boolean;
  isCurrent?: boolean;
  onNavigate?: () => void;
  onMarkComplete?: () => void;
  onCallCustomer?: () => void;
  readonly?: boolean;
}

export const DetailedStopCard: React.FC<DetailedStopCardProps> = ({
  stop,
  stopIndex,
  isCompleted = false,
  isCurrent = false,
  onNavigate,
  onMarkComplete,
  onCallCustomer,
  readonly = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <IonCard
      className={`detailed-stop-card ${isCompleted ? "opacity-75" : ""} ${isCurrent ? "border-l-4 border-blue-500" : ""}`}
    >
      <IonCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IonIcon
              icon={isCompleted ? checkmarkCircleOutline : ellipseOutline}
              className={
                isCompleted
                  ? "text-green-500 text-xl"
                  : isCurrent
                    ? "text-blue-500 text-xl"
                    : "text-gray-400 text-xl"
              }
            />
            <div>
              <IonCardTitle
                className={`text-lg ${isCompleted ? "line-through opacity-60" : ""}`}
              >
                Stop {stop.stopNumber} - {stop.customerName}
              </IonCardTitle>
              <div className="flex items-center gap-2 mt-1">
                <IonBadge
                  color={
                    isCurrent ? "primary" : isCompleted ? "success" : "medium"
                  }
                >
                  {stop.estimatedTime}
                </IonBadge>
                {isCurrent && <IonBadge color="warning">Current</IonBadge>}
                {isCompleted && <IonBadge color="success">Complete</IonBadge>}
              </div>
            </div>
          </div>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Less" : "Details"}
          </IonButton>
        </div>
      </IonCardHeader>

      <IonCardContent>
        {/* Basic Info - Always Visible */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <IonIcon icon={homeOutline} className="text-blue-500 mt-1" />
            <div className="flex-1">
              <div className="font-medium text-sm">Address</div>
              <div className="text-sm text-gray-600">{stop.address}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <IonIcon icon={cubeOutline} className="text-green-500 mt-1" />
            <div className="flex-1">
              <div className="font-medium text-sm">Items</div>
              <div className="text-sm text-gray-600">{stop.items}</div>
            </div>
          </div>
        </div>

        {/* Detailed Info - Expandable */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Customer Details */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IonIcon icon={personOutline} className="text-blue-600" />
                <span className="font-medium text-blue-900">
                  Customer Information
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{stop.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order:</span>
                  <span className="font-medium">{stop.orderNumber}</span>
                </div>
                {/* Add phone if available in future */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact:</span>
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={onCallCustomer}
                    disabled={!onCallCustomer}
                  >
                    <IonIcon icon={callOutline} slot="start" />
                    Call
                  </IonButton>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IonIcon icon={businessOutline} className="text-green-600" />
                <span className="font-medium text-green-900">
                  Order Details
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order #:</span>
                  <span className="font-medium">{stop.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{stop.items}</span>
                </div>
                {/* Add order value if available */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <IonBadge color={isCompleted ? "success" : "warning"}>
                    {isCompleted ? "Delivered" : "Pending"}
                  </IonBadge>
                </div>
              </div>
            </div>

            {/* Timing Details */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IonIcon icon={timeOutline} className="text-purple-600" />
                <span className="font-medium text-purple-900">
                  Timing Information
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Arrival:</span>
                  <span className="font-medium">{stop.estimatedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stop Duration:</span>
                  <span className="font-medium">~15-30 min</span>
                </div>
                {isCompleted && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">✓ Done</span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IonIcon
                  icon={informationCircleOutline}
                  className="text-orange-600"
                />
                <span className="font-medium text-orange-900">
                  Delivery Notes
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>• Standard delivery and setup</p>
                <p>• Check for safe setup area</p>
                <p>• Collect any remaining balance</p>
                <p>• Take completion photos</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!readonly && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            {onNavigate && (
              <IonButton
                expand="block"
                fill="outline"
                color="primary"
                onClick={onNavigate}
              >
                <IonIcon icon={navigateOutline} slot="start" />
                Navigate
              </IonButton>
            )}
            {!isCompleted && onMarkComplete && (
              <IonButton
                expand="block"
                color="success"
                onClick={onMarkComplete}
              >
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Complete Stop
              </IonButton>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

// NEW: Comprehensive Route Timeline Component
interface RouteTimelineProps {
  deliverySchedule: DeliveryStop[];
  completedStops?: number[];
  currentStop?: number;
  onNavigateToStop?: (stop: DeliveryStop) => void;
  onMarkStopComplete?: (stopNumber: number) => void;
  onCallCustomer?: (stop: DeliveryStop) => void;
  readonly?: boolean;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({
  deliverySchedule,
  completedStops = [],
  currentStop,
  onNavigateToStop,
  onMarkStopComplete,
  onCallCustomer,
  readonly = false,
}) => {
  return (
    <IonCard className="route-timeline-card">
      <IonCardHeader>
        <IonCardTitle className="flex items-center gap-2">
          <IonIcon icon={listOutline} className="text-indigo-500" />
          Detailed Route Timeline
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="space-y-4">
          {deliverySchedule.map((stop, index) => {
            const isCompleted = completedStops.includes(stop.stopNumber);
            const isCurrent = currentStop === stop.stopNumber;

            return (
              <DetailedStopCard
                key={stop.stopNumber}
                stop={stop}
                stopIndex={index}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                onNavigate={() => onNavigateToStop?.(stop)}
                onMarkComplete={() => onMarkStopComplete?.(stop.stopNumber)}
                onCallCustomer={() => onCallCustomer?.(stop)}
                readonly={readonly}
              />
            );
          })}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// NEW: Enhanced Items Breakdown Component
interface DetailedItemsCardProps {
  items: DeliveryItem[];
  deliverySchedule: DeliveryStop[];
  completedItems?: string[];
  onItemToggle?: (itemKey: string, completed: boolean) => void;
  readonly?: boolean;
}

export const DetailedItemsCard: React.FC<DetailedItemsCardProps> = ({
  items,
  deliverySchedule,
  completedItems = [],
  onItemToggle,
  readonly = false,
}) => {
  const [groupBy, setGroupBy] = useState<"order" | "stop">("order");

  // Group items by order or stop
  const groupedItems = React.useMemo(() => {
    if (groupBy === "order") {
      const groups: { [key: string]: DeliveryItem[] } = {};
      items.forEach((item) => {
        if (!groups[item.orderNumber]) {
          groups[item.orderNumber] = [];
        }
        groups[item.orderNumber].push(item);
      });
      return groups;
    } else {
      // Group by stop
      const groups: { [key: string]: DeliveryItem[] } = {};
      deliverySchedule.forEach((stop) => {
        groups[`Stop ${stop.stopNumber}`] = items.filter(
          (item) => item.orderNumber === stop.orderNumber,
        );
      });
      return groups;
    }
  }, [items, deliverySchedule, groupBy]);

  return (
    <IonCard className="detailed-items-card">
      <IonCardHeader>
        <div className="flex items-center justify-between">
          <IonCardTitle className="flex items-center gap-2">
            <IonIcon icon={cubeOutline} className="text-green-500" />
            Complete Items Breakdown ({items.length} items)
          </IonCardTitle>
          <div className="flex gap-1">
            <IonButton
              size="small"
              fill={groupBy === "order" ? "solid" : "outline"}
              color="primary"
              onClick={() => setGroupBy("order")}
            >
              By Order
            </IonButton>
            <IonButton
              size="small"
              fill={groupBy === "stop" ? "solid" : "outline"}
              color="primary"
              onClick={() => setGroupBy("stop")}
            >
              By Stop
            </IonButton>
          </div>
        </div>
      </IonCardHeader>
      <IonCardContent>
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([groupName, groupItems]) => (
            <div key={groupName} className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <IonIcon icon={businessOutline} className="text-blue-500" />
                {groupName}
                <IonBadge color="medium">{groupItems.length} items</IonBadge>
              </div>
              <div className="space-y-2">
                {groupItems.map((item, index) => {
                  const itemKey = `${item.orderNumber}-${item.name}`;
                  const isCompleted = completedItems.includes(itemKey);

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-2 bg-white rounded border ${
                        isCompleted ? "opacity-60" : ""
                      }`}
                    >
                      {!readonly && onItemToggle && (
                        <IonCheckbox
                          checked={isCompleted}
                          onIonChange={(e) =>
                            onItemToggle(itemKey, e.detail.checked)
                          }
                        />
                      )}
                      <div className="flex-1">
                        <div
                          className={`font-medium ${isCompleted ? "line-through" : ""}`}
                        >
                          {item.quantity}x {item.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Order: {item.orderNumber}
                        </div>
                      </div>
                      {isCompleted && (
                        <IonIcon
                          icon={checkmarkCircleOutline}
                          className="text-green-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
};
