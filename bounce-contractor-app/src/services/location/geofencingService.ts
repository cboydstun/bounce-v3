import { Geolocation, Position } from "@capacitor/geolocation";
import { Preferences } from "@capacitor/preferences";
import { offlineService } from "../offline/offlineService";

export interface GeofenceConfig {
  id: string;
  taskId: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  taskId: string;
  type: "enter" | "exit";
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: string;
  contractorId: string;
}

export interface GeofenceStatus {
  isInside: boolean;
  distance: number; // distance to center in meters
  lastChecked: string;
}

class GeofencingService {
  private static instance: GeofencingService;
  private geofences: Map<string, GeofenceConfig> = new Map();
  private watchId: string | null = null;
  private isMonitoring = false;
  private lastKnownPosition: Position | null = null;
  private geofenceStatuses: Map<string, GeofenceStatus> = new Map();
  private eventListeners: ((event: GeofenceEvent) => void)[] = [];

  private constructor() {
    this.loadGeofences();
  }

  public static getInstance(): GeofencingService {
    if (!GeofencingService.instance) {
      GeofencingService.instance = new GeofencingService();
    }
    return GeofencingService.instance;
  }

  /**
   * Add event listener for geofence events
   */
  public addEventListener(
    listener: (event: GeofenceEvent) => void,
  ): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Create a new geofence for a task
   */
  public async createGeofence(
    config: Omit<GeofenceConfig, "id" | "createdAt">,
  ): Promise<string> {
    const geofenceId = this.generateId();
    const geofence: GeofenceConfig = {
      ...config,
      id: geofenceId,
      createdAt: new Date().toISOString(),
    };

    this.geofences.set(geofenceId, geofence);
    await this.saveGeofences();

    console.log(`Created geofence ${geofenceId} for task ${config.taskId}`);

    // Start monitoring if this is the first active geofence
    if (config.isActive && !this.isMonitoring) {
      await this.startMonitoring();
    }

    return geofenceId;
  }

  /**
   * Update an existing geofence
   */
  public async updateGeofence(
    id: string,
    updates: Partial<GeofenceConfig>,
  ): Promise<void> {
    const geofence = this.geofences.get(id);
    if (!geofence) {
      throw new Error(`Geofence ${id} not found`);
    }

    const updatedGeofence = { ...geofence, ...updates };
    this.geofences.set(id, updatedGeofence);
    await this.saveGeofences();

    console.log(`Updated geofence ${id}`);
  }

  /**
   * Delete a geofence
   */
  public async deleteGeofence(id: string): Promise<void> {
    if (!this.geofences.has(id)) {
      throw new Error(`Geofence ${id} not found`);
    }

    this.geofences.delete(id);
    this.geofenceStatuses.delete(id);
    await this.saveGeofences();

    console.log(`Deleted geofence ${id}`);

    // Stop monitoring if no active geofences remain
    if (this.getActiveGeofences().length === 0) {
      await this.stopMonitoring();
    }
  }

  /**
   * Get all geofences for a specific task
   */
  public getGeofencesForTask(taskId: string): GeofenceConfig[] {
    return Array.from(this.geofences.values()).filter(
      (geofence) => geofence.taskId === taskId,
    );
  }

  /**
   * Get all active geofences
   */
  public getActiveGeofences(): GeofenceConfig[] {
    return Array.from(this.geofences.values()).filter(
      (geofence) => geofence.isActive,
    );
  }

  /**
   * Get geofence status (inside/outside, distance)
   */
  public getGeofenceStatus(id: string): GeofenceStatus | null {
    return this.geofenceStatuses.get(id) || null;
  }

  /**
   * Check if contractor is currently inside any geofence for a task
   */
  public isInsideTaskGeofence(taskId: string): boolean {
    const taskGeofences = this.getGeofencesForTask(taskId);
    return taskGeofences.some((geofence) => {
      const status = this.getGeofenceStatus(geofence.id);
      return status?.isInside || false;
    });
  }

  /**
   * Start monitoring geofences
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log("Geofence monitoring already active");
      return;
    }

    try {
      // Request location permissions
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== "granted") {
        throw new Error("Location permission not granted");
      }

      // Start watching position
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // 30 seconds
        },
        (position, err) => {
          if (position) {
            this.handleLocationUpdate(position);
          } else if (err) {
            console.error("Location watch error:", err);
          }
        },
      );

      this.isMonitoring = true;
      console.log("Started geofence monitoring");
    } catch (error) {
      console.error("Failed to start geofence monitoring:", error);
      throw error;
    }
  }

  /**
   * Stop monitoring geofences
   */
  public async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }

    this.isMonitoring = false;
    console.log("Stopped geofence monitoring");
  }

  /**
   * Handle location updates and check geofences
   */
  private handleLocationUpdate(position: Position): void {
    this.lastKnownPosition = position;
    const currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    // Check all active geofences
    const activeGeofences = this.getActiveGeofences();
    for (const geofence of activeGeofences) {
      this.checkGeofence(
        geofence,
        currentLocation,
        position.coords.accuracy || 0,
      );
    }
  }

  /**
   * Check if current location triggers a geofence event
   */
  private checkGeofence(
    geofence: GeofenceConfig,
    currentLocation: { latitude: number; longitude: number },
    accuracy: number,
  ): void {
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      geofence.center.latitude,
      geofence.center.longitude,
    );

    const wasInside = this.geofenceStatuses.get(geofence.id)?.isInside || false;
    const isInside = distance <= geofence.radius;

    // Update status
    this.geofenceStatuses.set(geofence.id, {
      isInside,
      distance,
      lastChecked: new Date().toISOString(),
    });

    // Check for state changes
    if (!wasInside && isInside) {
      // Entered geofence
      this.triggerGeofenceEvent(geofence, "enter", currentLocation, accuracy);
    } else if (wasInside && !isInside) {
      // Exited geofence
      this.triggerGeofenceEvent(geofence, "exit", currentLocation, accuracy);
    }
  }

  /**
   * Trigger a geofence event
   */
  private async triggerGeofenceEvent(
    geofence: GeofenceConfig,
    type: "enter" | "exit",
    location: { latitude: number; longitude: number },
    accuracy: number,
  ): Promise<void> {
    const event: GeofenceEvent = {
      id: this.generateId(),
      geofenceId: geofence.id,
      taskId: geofence.taskId,
      type,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy,
      },
      timestamp: new Date().toISOString(),
      contractorId: "current-contractor", // This should come from auth store
    };

    console.log(`Geofence ${type} event for task ${geofence.taskId}:`, event);

    // Notify listeners
    this.eventListeners.forEach((listener) => listener(event));

    // Handle automatic task status updates
    if (type === "enter") {
      await this.handleGeofenceEntry(geofence, event);
    } else {
      await this.handleGeofenceExit(geofence, event);
    }

    // Store event for offline sync
    await this.storeGeofenceEvent(event);
  }

  /**
   * Handle geofence entry (arrival at task location)
   */
  private async handleGeofenceEntry(
    geofence: GeofenceConfig,
    event: GeofenceEvent,
  ): Promise<void> {
    try {
      // Update geofence to mark as triggered
      await this.updateGeofence(geofence.id, {
        triggeredAt: event.timestamp,
      });

      // Queue task status update for offline sync
      await offlineService.queueAction({
        type: "task_status_update",
        payload: {
          taskId: geofence.taskId,
          status: "in_progress",
          location: event.location,
          notes: `Contractor arrived at task location (auto-detected)`,
          timestamp: event.timestamp,
        },
        priority: "high",
        endpoint: `/tasks/${geofence.taskId}/status`,
        method: "PUT",
        requiresAuth: true,
      });

      console.log(
        `Auto-updated task ${geofence.taskId} to 'in_progress' on geofence entry`,
      );
    } catch (error) {
      console.error("Failed to handle geofence entry:", error);
    }
  }

  /**
   * Handle geofence exit (leaving task location)
   */
  private async handleGeofenceExit(
    geofence: GeofenceConfig,
    event: GeofenceEvent,
  ): Promise<void> {
    // For now, just log the exit
    // In the future, we might want to prompt the contractor about task completion
    console.log(`Contractor left task location for task ${geofence.taskId}`);
  }

  /**
   * Store geofence event for offline sync
   */
  private async storeGeofenceEvent(event: GeofenceEvent): Promise<void> {
    try {
      const events = await this.getStoredEvents();
      events.push(event);

      // Keep only last 100 events to prevent storage bloat
      const recentEvents = events.slice(-100);

      await Preferences.set({
        key: "geofence_events",
        value: JSON.stringify(recentEvents),
      });
    } catch (error) {
      console.error("Failed to store geofence event:", error);
    }
  }

  /**
   * Get stored geofence events
   */
  private async getStoredEvents(): Promise<GeofenceEvent[]> {
    try {
      const { value } = await Preferences.get({ key: "geofence_events" });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error("Failed to get stored events:", error);
      return [];
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Load geofences from storage
   */
  private async loadGeofences(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: "geofences" });
      if (value) {
        const geofencesArray: GeofenceConfig[] = JSON.parse(value);
        this.geofences.clear();
        geofencesArray.forEach((geofence) => {
          this.geofences.set(geofence.id, geofence);
        });
        console.log(`Loaded ${geofencesArray.length} geofences from storage`);
      }
    } catch (error) {
      console.error("Failed to load geofences:", error);
    }
  }

  /**
   * Save geofences to storage
   */
  private async saveGeofences(): Promise<void> {
    try {
      const geofencesArray = Array.from(this.geofences.values());
      await Preferences.set({
        key: "geofences",
        value: JSON.stringify(geofencesArray),
      });
    } catch (error) {
      console.error("Failed to save geofences:", error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current location
   */
  public async getCurrentLocation(): Promise<Position> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      this.lastKnownPosition = position;
      return position;
    } catch (error) {
      console.error("Failed to get current location:", error);
      throw error;
    }
  }

  /**
   * Get last known position
   */
  public getLastKnownPosition(): Position | null {
    return this.lastKnownPosition;
  }

  /**
   * Check if monitoring is active
   */
  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get all geofences
   */
  public getAllGeofences(): GeofenceConfig[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Clear all geofences (for testing/cleanup)
   */
  public async clearAllGeofences(): Promise<void> {
    this.geofences.clear();
    this.geofenceStatuses.clear();
    await this.saveGeofences();
    await this.stopMonitoring();
    console.log("Cleared all geofences");
  }
}

// Export singleton instance
export const geofencingService = GeofencingService.getInstance();
