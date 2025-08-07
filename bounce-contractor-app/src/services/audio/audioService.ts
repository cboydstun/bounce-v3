import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import {
  AudioConfig,
  SoundType,
  AudioAlert,
  AudioPlaybackOptions,
  AudioCapabilities,
  AudioPreferences,
  AudioState,
  AudioServiceStatus,
  SoundFile,
} from "../../types/audio.types";
import { APP_CONFIG } from "../../config/app.config";

class AudioService {
  private config: AudioConfig = {
    enabled: true,
    volume: 0.8,
    vibrationEnabled: true,
    respectSilentMode: true,
    customSounds: false,
  };

  private preferences: AudioPreferences = {
    masterVolume: 0.8,
    soundEnabled: true,
    vibrationEnabled: true,
    respectSilentMode: true,
    taskSounds: {
      new_task_low: { enabled: true, volume: 0.6 },
      new_task_medium: { enabled: true, volume: 0.7 },
      new_task_high: { enabled: true, volume: 0.8 },
      new_task_urgent: { enabled: true, volume: 1.0 },
      task_assigned: { enabled: true, volume: 0.7 },
      task_completed: { enabled: true, volume: 0.6 },
      notification_general: { enabled: true, volume: 0.5 },
      alert_critical: { enabled: true, volume: 1.0 },
    },
  };

  private soundFiles: Map<SoundType, SoundFile> = new Map([
    [
      "new_task_low",
      {
        id: "new_task_low",
        name: "New Task (Low Priority)",
        path: "/sounds/new-task-low.mp3",
        duration: 1500,
        type: "new_task_low",
      },
    ],
    [
      "new_task_medium",
      {
        id: "new_task_medium",
        name: "New Task (Medium Priority)",
        path: "/sounds/new-task-medium.mp3",
        duration: 2000,
        type: "new_task_medium",
      },
    ],
    [
      "new_task_high",
      {
        id: "new_task_high",
        name: "New Task (High Priority)",
        path: "/sounds/new-task-high.mp3",
        duration: 2500,
        type: "new_task_high",
      },
    ],
    [
      "new_task_urgent",
      {
        id: "new_task_urgent",
        name: "New Task (Urgent)",
        path: "/sounds/new-task-urgent.mp3",
        duration: 3000,
        type: "new_task_urgent",
      },
    ],
    [
      "task_assigned",
      {
        id: "task_assigned",
        name: "Task Assigned",
        path: "/sounds/task-assigned.mp3",
        duration: 1800,
        type: "task_assigned",
      },
    ],
    [
      "task_completed",
      {
        id: "task_completed",
        name: "Task Completed",
        path: "/sounds/task-completed.mp3",
        duration: 2200,
        type: "task_completed",
      },
    ],
    [
      "notification_general",
      {
        id: "notification_general",
        name: "General Notification",
        path: "/sounds/notification.mp3",
        duration: 1000,
        type: "notification_general",
      },
    ],
    [
      "alert_critical",
      {
        id: "alert_critical",
        name: "Critical Alert",
        path: "/sounds/alert-critical.mp3",
        duration: 4000,
        type: "alert_critical",
      },
    ],
  ]);

  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<SoundType, AudioBuffer> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private currentState: AudioState = "idle";
  private isInitialized = false;
  private capabilities: AudioCapabilities = {
    canPlayAudio: false,
    canVibrate: false,
    supportedFormats: [],
    maxVolume: 1.0,
    respectsSilentMode: true,
  };

  constructor(config?: Partial<AudioConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Initialize the audio service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("Audio service already initialized");
      return;
    }

    try {
      await this.detectCapabilities();

      if (Capacitor.isNativePlatform()) {
        await this.initializeNative();
      } else {
        await this.initializeWeb();
      }

      await this.loadPreferences();
      this.isInitialized = true;

      console.log("Audio service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio service:", error);
      throw error;
    }
  }

  /**
   * Detect device audio capabilities
   */
  private async detectCapabilities(): Promise<void> {
    this.capabilities = {
      canPlayAudio: this.canPlayAudio(),
      canVibrate: await this.canVibrate(),
      supportedFormats: this.getSupportedFormats(),
      maxVolume: 1.0,
      respectsSilentMode: this.config.respectSilentMode,
    };
  }

  /**
   * Initialize native audio (iOS/Android)
   */
  private async initializeNative(): Promise<void> {
    // For native platforms, we'll use HTML5 audio with Capacitor optimizations
    // Native audio plugins can be added later if needed
    console.log("Initializing native audio support");
  }

  /**
   * Initialize web audio
   */
  private async initializeWeb(): Promise<void> {
    if (
      typeof AudioContext !== "undefined" ||
      typeof (window as any).webkitAudioContext !== "undefined"
    ) {
      this.audioContext = new (AudioContext ||
        (window as any).webkitAudioContext)();
      console.log("Web Audio API initialized");
    } else {
      console.warn("Web Audio API not supported, falling back to HTML5 audio");
    }
  }

  /**
   * Play an audio alert
   */
  async playAlert(alert: AudioAlert): Promise<void> {
    if (!this.isInitialized) {
      console.warn("Audio service not initialized");
      return;
    }

    if (!this.config.enabled || !this.preferences.soundEnabled) {
      console.log("Audio alerts disabled");
      return;
    }

    const soundConfig = this.preferences.taskSounds[alert.soundType];
    if (!soundConfig?.enabled) {
      console.log(`Sound disabled for type: ${alert.soundType}`);
      return;
    }

    try {
      // Play sound
      await this.playSound(alert.soundType, {
        volume:
          alert.volume || soundConfig.volume || this.preferences.masterVolume,
        fadeIn: alert.fadeIn,
        fadeOut: alert.fadeOut,
      });

      // Trigger vibration if enabled
      if (alert.vibrationPattern && this.preferences.vibrationEnabled) {
        await this.vibrate(alert.vibrationPattern);
      }
    } catch (error) {
      console.error("Failed to play audio alert:", error);
      this.currentState = "error";
    }
  }

  /**
   * Play a specific sound
   */
  async playSound(
    soundType: SoundType,
    options: AudioPlaybackOptions = {},
  ): Promise<void> {
    if (!this.capabilities.canPlayAudio) {
      console.warn("Audio playback not supported");
      return;
    }

    const soundFile = this.soundFiles.get(soundType);
    if (!soundFile) {
      throw new Error(`Sound file not found for type: ${soundType}`);
    }

    this.currentState = "loading";

    try {
      if (this.audioContext && this.audioBuffers.has(soundType)) {
        // Use Web Audio API for better performance
        await this.playWithWebAudio(soundType, options);
      } else {
        // Fallback to HTML5 audio
        await this.playWithHtmlAudio(soundFile, options);
      }
    } catch (error) {
      console.error(`Failed to play sound ${soundType}:`, error);
      this.currentState = "error";
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error("Audio playback failed"),
        );
      }
      throw error;
    }
  }

  /**
   * Play sound using Web Audio API
   */
  private async playWithWebAudio(
    soundType: SoundType,
    options: AudioPlaybackOptions,
  ): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContext not available");
    }

    const buffer = this.audioBuffers.get(soundType);
    if (!buffer) {
      throw new Error("Audio buffer not loaded");
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Set volume
    const volume =
      (options.volume || this.preferences.masterVolume) * this.config.volume;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    // Handle fade in/out
    if (options.fadeIn) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.1,
      );
    }

    if (options.fadeOut) {
      const duration = buffer.duration;
      gainNode.gain.setValueAtTime(
        volume,
        this.audioContext.currentTime + duration - 0.1,
      );
      gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + duration,
      );
    }

    this.currentState = "playing";

    return new Promise((resolve, reject) => {
      source.onended = () => {
        this.currentState = "idle";
        if (options.onComplete) {
          options.onComplete();
        }
        resolve();
      };

      // Web Audio API doesn't have onerror on AudioBufferSourceNode
      // We'll handle errors through try/catch when starting
      try {
        source.start();
      } catch (error) {
        this.currentState = "error";
        reject(error);
      }
    });
  }

  /**
   * Play sound using HTML5 audio
   */
  private async playWithHtmlAudio(
    soundFile: SoundFile,
    options: AudioPlaybackOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(soundFile.path);

      // Set volume
      const volume =
        (options.volume || this.preferences.masterVolume) * this.config.volume;
      audio.volume = Math.min(volume, this.capabilities.maxVolume);

      // Set loop
      audio.loop = options.loop || false;

      this.currentAudio = audio;
      this.currentState = "playing";

      audio.onloadeddata = () => {
        audio.play().catch(reject);
      };

      audio.onended = () => {
        this.currentState = "idle";
        this.currentAudio = null;
        if (options.onComplete) {
          options.onComplete();
        }
        resolve();
      };

      audio.onerror = (error) => {
        this.currentState = "error";
        this.currentAudio = null;
        reject(error);
      };

      // Start loading
      audio.load();
    });
  }

  /**
   * Trigger device vibration
   */
  async vibrate(pattern: number[] = [200]): Promise<void> {
    if (!this.capabilities.canVibrate || !this.preferences.vibrationEnabled) {
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Haptics for native platforms
        for (let i = 0; i < pattern.length; i += 2) {
          const duration = pattern[i];
          if (duration > 0) {
            await Haptics.impact({ style: ImpactStyle.Medium });
            if (duration > 50) {
              await new Promise((resolve) =>
                setTimeout(resolve, duration - 50),
              );
            }
          }

          // Handle pause between vibrations
          if (i + 1 < pattern.length) {
            const pause = pattern[i + 1];
            if (pause > 0) {
              await new Promise((resolve) => setTimeout(resolve, pause));
            }
          }
        }
      } else {
        // Use Web Vibration API for web
        if (navigator.vibrate) {
          navigator.vibrate(pattern);
        }
      }
    } catch (error) {
      console.error("Vibration failed:", error);
    }
  }

  /**
   * Stop current audio playback
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentState = "stopped";
  }

  /**
   * Pause current audio playback
   */
  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.currentState = "paused";
    }
  }

  /**
   * Resume paused audio playback
   */
  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(console.error);
      this.currentState = "playing";
    }
  }

  /**
   * Get current service status
   */
  getStatus(): AudioServiceStatus {
    return {
      isInitialized: this.isInitialized,
      isSupported: this.capabilities.canPlayAudio,
      currentState: this.currentState,
      error: this.currentState === "error" ? "Audio playback error" : undefined,
      capabilities: { ...this.capabilities },
    };
  }

  /**
   * Update audio preferences
   */
  updatePreferences(preferences: Partial<AudioPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
  }

  /**
   * Get current preferences
   */
  getPreferences(): AudioPreferences {
    return { ...this.preferences };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if audio playback is supported
   */
  private canPlayAudio(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true; // Native platforms support audio
    }

    // Check web audio support
    const audio = document.createElement("audio");
    return !!(
      audio.canPlayType &&
      (audio.canPlayType("audio/mpeg").replace(/no/, "") ||
        audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, "") ||
        audio.canPlayType('audio/wav; codecs="1"').replace(/no/, ""))
    );
  }

  /**
   * Check if vibration is supported
   */
  private async canVibrate(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      // Check if Haptics is available
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
        return true;
      } catch {
        return false;
      }
    } else {
      return "vibrate" in navigator;
    }
  }

  /**
   * Get supported audio formats
   */
  private getSupportedFormats(): string[] {
    const audio = document.createElement("audio");
    const formats: string[] = [];

    if (audio.canPlayType("audio/mpeg").replace(/no/, "")) {
      formats.push("mp3");
    }
    if (audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, "")) {
      formats.push("ogg");
    }
    if (audio.canPlayType('audio/wav; codecs="1"').replace(/no/, "")) {
      formats.push("wav");
    }
    if (audio.canPlayType("audio/mp4").replace(/no/, "")) {
      formats.push("m4a");
    }

    return formats;
  }

  /**
   * Load preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = localStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS,
      );
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.audioPreferences) {
          this.preferences = {
            ...this.preferences,
            ...parsed.audioPreferences,
          };
        }
      }
    } catch (error) {
      console.error("Failed to load audio preferences:", error);
    }
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    try {
      const existing = localStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS,
      );
      const settings = existing ? JSON.parse(existing) : {};
      settings.audioPreferences = this.preferences;
      localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error("Failed to save audio preferences:", error);
    }
  }

  /**
   * Preload audio files for better performance
   */
  async preloadSounds(): Promise<void> {
    if (!this.audioContext) return;

    const loadPromises = Array.from(this.soundFiles.entries()).map(
      async ([soundType, soundFile]) => {
        try {
          const response = await fetch(soundFile.path);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer =
            await this.audioContext!.decodeAudioData(arrayBuffer);
          this.audioBuffers.set(soundType, audioBuffer);
          console.log(`Preloaded sound: ${soundType}`);
        } catch (error) {
          console.warn(`Failed to preload sound ${soundType}:`, error);
        }
      },
    );

    await Promise.allSettled(loadPromises);
  }

  /**
   * Test audio playback
   */
  async testAudio(
    soundType: SoundType = "notification_general",
  ): Promise<void> {
    await this.playSound(soundType, {
      volume: 0.5,
      onComplete: () => console.log("Test audio completed"),
      onError: (error) => console.error("Test audio failed:", error),
    });
  }

  /**
   * Cleanup resources with comprehensive error handling
   */
  async destroy(): Promise<void> {
    console.log("Starting audio service cleanup...");

    try {
      // Stop any current playback
      this.stop();

      // Clear audio buffers
      this.audioBuffers.clear();

      // Close AudioContext with error handling
      if (this.audioContext) {
        try {
          if (this.audioContext.state !== "closed") {
            await this.audioContext.close();
          }
        } catch (error) {
          console.warn("Failed to close AudioContext gracefully:", error);
          // Force cleanup
          this.audioContext = null;
        }
        this.audioContext = null;
      }

      // Clear current audio element
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          this.currentAudio.src = "";
          this.currentAudio.load();
        } catch (error) {
          console.warn("Failed to cleanup HTML audio element:", error);
        }
        this.currentAudio = null;
      }

      // Reset all state
      this.isInitialized = false;
      this.currentState = "idle";

      // Reset capabilities
      this.capabilities = {
        canPlayAudio: false,
        canVibrate: false,
        supportedFormats: [],
        maxVolume: 1.0,
        respectsSilentMode: true,
      };

      console.log("Audio service cleanup completed successfully");
    } catch (error) {
      console.error("Audio service cleanup failed:", error);
      // Force reset even if cleanup failed
      this.audioContext = null;
      this.currentAudio = null;
      this.audioBuffers.clear();
      this.isInitialized = false;
      this.currentState = "error";
      throw error;
    }
  }

  /**
   * Force cleanup - use when graceful cleanup fails
   */
  forceDestroy(): void {
    console.warn("Force destroying audio service...");

    // Aggressive cleanup
    this.audioContext = null;
    this.currentAudio = null;
    this.audioBuffers.clear();
    this.isInitialized = false;
    this.currentState = "idle";
    this.capabilities = {
      canPlayAudio: false,
      canVibrate: false,
      supportedFormats: [],
      maxVolume: 1.0,
      respectsSilentMode: true,
    };

    console.log("Audio service force cleanup completed");
  }
}

// Create singleton instance
export const audioService = new AudioService();

// Export class for testing
export { AudioService };
