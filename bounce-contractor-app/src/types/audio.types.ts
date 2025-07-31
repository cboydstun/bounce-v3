export interface AudioConfig {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  vibrationEnabled: boolean;
  respectSilentMode: boolean;
  customSounds: boolean;
}

export interface SoundFile {
  id: string;
  name: string;
  path: string;
  duration: number; // in milliseconds
  type: SoundType;
}

export type SoundType =
  | "new_task_low"
  | "new_task_medium"
  | "new_task_high"
  | "new_task_urgent"
  | "task_assigned"
  | "task_completed"
  | "notification_general"
  | "alert_critical";

export interface AudioAlert {
  soundType: SoundType;
  volume?: number;
  vibrationPattern?: number[];
  repeat?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

export interface AudioPlaybackOptions {
  volume?: number;
  loop?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface AudioCapabilities {
  canPlayAudio: boolean;
  canVibrate: boolean;
  supportedFormats: string[];
  maxVolume: number;
  respectsSilentMode: boolean;
}

export interface AudioPreferences {
  masterVolume: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  respectSilentMode: boolean;
  taskSounds: {
    [key in SoundType]?: {
      enabled: boolean;
      volume: number;
      customPath?: string;
    };
  };
}

export type AudioState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "stopped"
  | "error";

export interface AudioServiceStatus {
  isInitialized: boolean;
  isSupported: boolean;
  currentState: AudioState;
  currentSound?: SoundType;
  error?: string;
  capabilities: AudioCapabilities;
}
