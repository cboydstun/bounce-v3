import { Geolocation, Position } from "@capacitor/geolocation";
import { Preferences } from "@capacitor/preferences";
import { App } from "@capacitor/app";
import { offlineService } from "../offline/offlineService";

export interface LocationUpdate {
  id: string;
  contractorId: string;
  taskId?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: string;
  isBackground: boolean;
  batteryLevel?: number;
}

export interface LocationTrackingConfig {
  taskId: string;
  updateInterval: number; // milliseconds
  enableHighAccuracy: boolean;
  maxAge: number; // milliseconds
  timeout: number; // milliseconds
  distanceFilter: number; // meters - minimum distance to trigger update
}

export interface LocationTrackingSession {
  id: string;
  taskId: string;
  contractorId: string;
  startTime: string;
  endTime?: string;
  config: LocationTrackingConfig;
  isActive: boolean;
  totalUpdates: number;
  lastUpdate?: string;
}

class BackgroundLocationService {
  private static instance: BackgroundLocationService;
  private watchId: string | null = null;
  private isTracking = false;
  private currentSession: LocationTrackingSession | null = null;
  private lastKnownPosition: Position | null = null;
  private updateListeners: ((update: LocationUpdate) => void)[] = [];
  private sessionListeners: ((session: LocationTrackingSession) => void)[] = [];
  private locationHistory: LocationUpdate[] = [];
  private updateQueue: LocationUpdate[] = [];
  private syncTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadLocationHistory();
    this.setupAppStateHandlers();
  }

  public static getInstance(): BackgroundLocationService {
    if (!BackgroundLocationService.instance) {
      BackgroundLocationService.instance = new BackgroundLocationService();
    }
    return BackgroundLocationService.instance;
  }

  /**
   * Start location tracking for a task
   */
  public async startTracking(config: LocationTrackingConfig): Promise<string> {
    if (this.isTracking) {
      throw new Error("Location tracking is already active");
    }

    try {
      // Request location permissions
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== "granted") {
        throw new Error("Location permission not granted");
      }

      // Create tracking session
      const sessionId = this.generateId();
      this.currentSession = {
        id: sessionId,
        taskId: config.taskId,
        contractorId: "current-contractor", // Should come from auth store
        startTime: new Date().toISOString(),
        config,
        isActive: true,
        totalUpdates: 0,
      };

      // Start location watching
      await this.startLocationWatch(config);

      // Start sync timer
      this.startSyncTimer();

      // Save session
      await this.saveSession();

      console.log(`Started location tracking for task ${config.taskId}`);
      this.notifySessionListeners();

      return sessionId;
    } catch (error) {
      console.error("Failed to start location tracking:", error);
      throw error;
    }
  }

  /**
   * Stop location tracking
   */
  public async stopTracking(): Promise<void> {
    if (!this.isTracking || !this.currentSession) {
      return;
    }

    try {
      // Stop location watching
      if (this.watchId) {
        await Geolocation.clearWatch({ id: this.watchId });
        this.watchId = null;
      }

      // Stop sync timer
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
        this.syncTimer = null;
      }

      // Update session
      this.currentSession.endTime = new Date().toISOString();
      this.currentSession.isActive = false;

      // Final sync
      await this.syncLocationUpdates();

      // Save final session state
      await this.saveSession();

      console.log(`Stopped location tracking for task ${this.currentSession.taskId}`);
      this.notifySessionListeners();

      this.isTracking = false;
      this.currentSession = null;
    } catch (error) {
      console.error("Failed to stop location tracking:", error);
      throw error;
    }
  }

  /**
   * Start location watching
   */
  private async startLocationWatch(config: LocationTrackingConfig): Promise<void> {
    this.watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: config.timeout,
        maximumAge: config.maxAge,
      },
      (position, err) => {
        if (position) {
          this.handleLocationUpdate(position);
        } else if (err) {
          console.error("Location watch error:", err);
        }
      }
    );

    this.isTracking = true;
  }

  /**
   * Handle location updates
   */
  private async handleLocationUpdate(position: Position): Promise<void> {
    if (!this.currentSession) return;

    // Check distance filter
    if (this.lastKnownPosition && this.currentSession.config.distanceFilter > 0) {
      const distance = this.calculateDistance(
        this.lastKnownPosition.coords.latitude,
        this.lastKnownPosition.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );

      if (distance < this.currentSession.config.distanceFilter) {
        return; // Skip update if distance is too small
      }
    }

    this.lastKnownPosition = position;

    // Create location update
    const update: LocationUpdate = {
      id: this.generateId(),
      contractorId: this.currentSession.contractorId,
      taskId: this.currentSession.taskId,
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      },
      timestamp: new Date().toISOString(),
      isBackground: await this.isAppInBackground(),
      batteryLevel: await this.getBatteryLevel(),
    };

    // Add to history and queue
    this.locationHistory.push(update);
    this.updateQueue.push(update);

    // Update session
    this.currentSession.totalUpdates++;
    this.currentSession.lastUpdate = update.timestamp;

    // Notify listeners
    this.notifyUpdateListeners(update);

    // Limit history size
    if (this.locationHistory.length > 1000) {
      this.locationHistory = this.locationHistory.slice(-500);
    }

    // Save to storage
    await this.saveLocationHistory();

    console.log(`Location update for task ${this.currentSession.taskId}:`, {
      lat: update.location.latitude,
      lng: update.location.longitude,
      accuracy: update.location.accuracy,
      isBackground: update.isBackground,
    });
  }

  /**
   * Start sync timer to periodically sync location updates
   */
  private startSyncTimer(): void {
    this.syncTimer = setInterval(async () => {
      await this.syncLocationUpdates();
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Sync location updates to server
   */
  private async syncLocationUpdates(): Promise<void> {
    if (this.updateQueue.length === 0) return;

    try {
      // Queue location updates for offline sync
      for (const update of this.updateQueue) {
        await offlineService.queueAction({
          type: "location_update",
          payload: update,
          priority: "low",
          endpoint: "/contractors/location",
          method: "POST",
          requiresAuth: true,
        });
      }

      console.log(`Queued ${this.updateQueue.length} location updates for sync`);
      this.updateQueue = [];
    } catch (error) {
      console.error("Failed to sync location updates:", error);
    }
  }

  /**
   * Setup app state handlers for background tracking
   */
  private setupAppStateHandlers(): void {
    App.addListener("appStateChange", (state) => {
      if (this.isTracking) {
        console.log(`App state changed: ${state.isActive ? "foreground" : "background"}`);
        
        if (!state.isActive) {
          // App went to background
          this.handleAppBackground();
        } else {
          // App came to foreground
          this.handleAppForeground();
        }
      }
    });
  }

  /**
   * Handle app going to background
   */
  private handleAppBackground(): void {
    console.log("App went to background, continuing location tracking");
    // In a real implementation, you might want to:
    // - Reduce update frequency to save battery
    // - Show persistent notification
    // - Register background task
  }

  /**
   * Handle app coming to foreground
   */
  private handleAppForeground(): void {
    console.log("App came to foreground, resuming normal location tracking");
    // In a real implementation, you might want to:
    // - Restore normal update frequency
    // - Hide persistent notification
    // - Sync any queued updates
    this.syncLocationUpdates();
  }

  /**
   * Check if app is in background
   */
  private async isAppInBackground(): Promise<boolean> {
    try {
      const state = await App.getState();
      return !state.isActive;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get battery level (mock implementation)
   */
  private async getBatteryLevel(): Promise<number | undefined> {
    // In a real implementation, you would use @capacitor/device
    // const info = await Device.getBatteryInfo();
    // return info.batteryLevel;
    return undefined;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add update listener
   */
  public addUpdateListener(listener: (update: LocationUpdate) => void): () => void {
    this.updateListeners.push(listener);
    return () => {
      const index = this.updateListeners.indexOf(listener);
      if (index > -1) {
        this.updateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add session listener
   */
  public addSessionListener(listener: (session: LocationTrackingSession) => void): () => void {
    this.sessionListeners.push(listener);
    return () => {
      const index = this.sessionListeners.indexOf(listener);
      if (index > -1) {
        this.sessionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify update listeners
   */
  private notifyUpdateListeners(update: LocationUpdate): void {
    this.updateListeners.forEach((listener) => listener(update));
  }

  /**
   * Notify session listeners
   */
  private notifySessionListeners(): void {
    if (this.currentSession) {
      this.sessionListeners.forEach((listener) => listener(this.currentSession!));
    }
  }

  /**
   * Save location history to storage
   */
  private async saveLocationHistory(): Promise<void> {
    try {
      // Keep only recent history to prevent storage bloat
      const recentHistory = this.locationHistory.slice(-500);
      await Preferences.set({
        key: "location_history",
        value: JSON.stringify(recentHistory),
      });
    } catch (error) {
      console.error("Failed to save location history:", error);
    }
  }

  /**
   * Load location history from storage
   */
  private async loadLocationHistory(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: "location_history" });
      if (value) {
        this.locationHistory = JSON.parse(value);
        console.log(`Loaded ${this.locationHistory.length} location updates from storage`);
      }
    } catch (error) {
      console.error("Failed to load location history:", error);
    }
  }

  /**
   * Save current session to storage
   */
  private async saveSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await Preferences.set({
        key: "location_session",
        value: JSON.stringify(this.currentSession),
      });
    } catch (error) {
      console.error("Failed to save location session:", error);
    }
  }

  /**
   * Load session from storage (for app restart recovery)
   */
  public async loadSession(): Promise<LocationTrackingSession | null> {
    try {
      const { value } = await Preferences.get({ key: "location_session" });
      if (value) {
        const session: LocationTrackingSession = JSON.parse(value);
        if (session.isActive) {
          this.currentSession = session;
          console.log(`Restored active location session for task ${session.taskId}`);
          return session;
        }
      }
    } catch (error) {
      console.error("Failed to load location session:", error);
    }
    return null;
  }

  /**
   * Get current tracking status
   */
  public getTrackingStatus(): {
    isTracking: boolean;
    session: LocationTrackingSession | null;
    lastPosition: Position | null;
    queuedUpdates: number;
  } {
    return {
      isTracking: this.isTracking,
      session: this.currentSession,
      lastPosition: this.lastKnownPosition,
      queuedUpdates: this.updateQueue.length,
    };
  }

  /**
   * Get location history for a task
   */
  public getLocationHistory(taskId?: string): LocationUpdate[] {
    if (taskId) {
      return this.locationHistory.filter((update) => update.taskId === taskId);
    }
    return [...this.locationHistory];
  }

  /**
   * Clear location history
   */
  public async clearLocationHistory(): Promise<void> {
    this.locationHistory = [];
    await Preferences.remove({ key: "location_history" });
    console.log("Cleared location history");
  }

  /**
   * Get current location (one-time)
   */
  public async getCurrentLocation(): Promise<Position> {
    return await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
  }
}

// Export singleton instance
export const backgroundLocationService = BackgroundLocationService.getInstance();
