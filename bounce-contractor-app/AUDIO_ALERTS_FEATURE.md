# Audio Alerts Feature Implementation

This document describes the implementation of the audio alerts feature for the Bounce Contractor mobile app. The feature provides audible notifications when new tasks become available, enhancing the contractor's ability to quickly respond to opportunities.

## 🎯 Feature Overview

The audio alerts system provides:

- **Audible notifications** for new tasks based on priority levels
- **Vibration patterns** for silent mode compatibility
- **Integration** with existing push notification system
- **Real-time alerts** via WebSocket connections
- **Customizable settings** for different sound preferences
- **Cross-platform support** for web, iOS, and Android

## 🏗️ Architecture

### Core Components

1. **AudioService** (`src/services/audio/audioService.ts`)

   - Manages audio playback using Web Audio API and HTML5 Audio
   - Handles device capabilities detection
   - Provides volume control and user preferences
   - Supports both native and web platforms

2. **Audio Types** (`src/types/audio.types.ts`)

   - TypeScript definitions for audio configuration
   - Sound types for different notification priorities
   - Audio preferences and capabilities interfaces

3. **useAudioAlerts Hook** (`src/hooks/audio/useAudioAlerts.ts`)

   - React hook for managing audio alerts
   - Provides easy-to-use interface for components
   - Handles initialization and error states

4. **useNotificationSystem Hook** (`src/hooks/notifications/useNotificationSystem.ts`)
   - Comprehensive notification management
   - Combines push notifications and audio alerts
   - Provides unified interface for all notification features

### Integration Points

1. **WebSocket Service** (`src/services/realtime/websocketService.ts`)

   - Triggers audio alerts on `task:new` events
   - Handles different task priorities automatically
   - Integrates with existing real-time communication

2. **Push Notification Service** (`src/services/notifications/pushNotifications.ts`)
   - Enhanced to trigger audio alerts for push notifications
   - Supports both foreground and background notifications
   - Maintains compatibility with existing notification system

## 🔊 Sound System

### Sound Types and Priorities

| Priority | Sound File            | Duration | Description                 |
| -------- | --------------------- | -------- | --------------------------- |
| Low      | `new-task-low.mp3`    | ~1.5s    | Gentle notification sound   |
| Medium   | `new-task-medium.mp3` | ~2.0s    | Standard notification sound |
| High     | `new-task-high.mp3`   | ~2.5s    | Attention-grabbing sound    |
| Urgent   | `new-task-urgent.mp3` | ~3.0s    | Critical alert sound        |

### Additional Sounds

- `task-assigned.mp3` - Task assignment confirmation
- `task-completed.mp3` - Task completion success sound
- `notification.mp3` - General notification sound
- `alert-critical.mp3` - System-wide critical alerts

### Vibration Patterns

Each priority level has a corresponding vibration pattern:

- **Low**: Single short vibration (200ms)
- **Medium**: Double vibration (200ms, 100ms pause, 200ms)
- **High**: Triple vibration pattern
- **Urgent**: Extended pattern for maximum attention

## 🛠️ Implementation Details

### Audio Service Features

```typescript
// Initialize audio service
await audioService.initialize();

// Play alert with priority-based sound and vibration
await audioService.playAlert({
  soundType: "new_task_urgent",
  vibrationPattern: [500, 100, 500, 100, 500],
  fadeIn: true,
  repeat: 2,
});

// Test audio functionality
await audioService.testAudio("new_task_medium");
```

### WebSocket Integration

The WebSocket service automatically triggers audio alerts:

```typescript
// Automatically handled when WebSocket receives task:new event
websocketService.on("task:new", (eventData) => {
  const priority = eventData.payload.priority || "medium";
  // Audio alert is automatically triggered based on priority
});
```

### React Hook Usage

```typescript
const audioAlerts = useAudioAlerts({
  autoInitialize: true,
  preloadSounds: true,
});

// Play task alert
await audioAlerts.playTaskAlert("high");

// Update preferences
audioAlerts.updatePreferences({
  masterVolume: 0.8,
  soundEnabled: true,
  vibrationEnabled: true,
});
```

## 📱 Platform Support

### Web Browsers

- **Web Audio API** for high-performance audio
- **HTML5 Audio** fallback for compatibility
- **Web Vibration API** for haptic feedback
- **Service Worker** integration for background notifications

### iOS (via Capacitor)

- **Native audio** through Capacitor plugins
- **Haptics API** for vibration patterns
- **Background audio** support
- **Silent mode** detection and respect

### Android (via Capacitor)

- **Native audio** playback
- **Vibration API** integration
- **Notification channels** for audio alerts
- **Do Not Disturb** mode compatibility

## ⚙️ Configuration

### App Configuration

```typescript
// src/config/app.config.ts
export const APP_CONFIG = {
  // Audio Alerts
  AUDIO_ALERTS_ENABLED: true,
  AUDIO_MASTER_VOLUME: 0.8,
  AUDIO_VIBRATION_ENABLED: true,
  AUDIO_RESPECT_SILENT_MODE: true,
  AUDIO_PRELOAD_SOUNDS: true,
};
```

### User Preferences

Users can customize:

- Master volume level
- Enable/disable sounds for each priority
- Vibration patterns on/off
- Respect silent mode setting
- Custom sound file paths (future feature)

## 🧪 Testing

### Demo Component

The `AudioAlertsDemo` component provides a comprehensive testing interface:

- Test all priority levels
- Toggle audio/push notification settings
- View system status and capabilities
- Request permissions
- Test complete notification system

### Usage

```typescript
import { AudioAlertsDemo } from '../components/AudioAlertsDemo';

// In your component
<AudioAlertsDemo />
```

## 🚀 Usage Examples

### Basic Setup

```typescript
import { useNotificationSystem } from '../hooks/notifications/useNotificationSystem';

const MyComponent = () => {
  const notifications = useNotificationSystem({
    autoInitialize: true,
    enableAudioAlerts: true,
    enablePushNotifications: true
  });

  // Test new task alert
  const handleTestAlert = async () => {
    await notifications.playTaskAlert("urgent");
  };

  return (
    <button onClick={handleTestAlert}>
      Test Urgent Task Alert
    </button>
  );
};
```

### Advanced Configuration

```typescript
const notifications = useNotificationSystem();

// Customize audio preferences
notifications.audioAlerts.updatePreferences({
  masterVolume: 0.9,
  taskSounds: {
    new_task_urgent: { enabled: true, volume: 1.0 },
    new_task_high: { enabled: true, volume: 0.8 },
    new_task_medium: { enabled: true, volume: 0.6 },
    new_task_low: { enabled: false, volume: 0.4 },
  },
});
```

## 🔧 Troubleshooting

### Common Issues

1. **No Sound Playing**

   - Check if audio is enabled in preferences
   - Verify device volume is not muted
   - Ensure sound files are accessible
   - Check browser audio permissions

2. **Vibration Not Working**

   - Verify vibration is enabled in settings
   - Check device vibration settings
   - Ensure Haptics permission (iOS)

3. **WebSocket Alerts Not Triggering**
   - Verify WebSocket connection is active
   - Check audio service initialization
   - Ensure task priority is correctly set

### Debug Information

```typescript
// Check audio service status
const status = audioService.getStatus();
console.log("Audio Status:", status);

// Test capabilities
const capabilities = status.capabilities;
console.log("Can play audio:", capabilities.canPlayAudio);
console.log("Can vibrate:", capabilities.canVibrate);
```

## 🔮 Future Enhancements

### Planned Features

1. **Custom Sound Upload**

   - Allow users to upload custom notification sounds
   - Sound validation and conversion
   - Cloud storage integration

2. **Smart Volume Adjustment**

   - Automatic volume adjustment based on ambient noise
   - Time-based volume profiles
   - Location-based sound preferences

3. **Advanced Vibration Patterns**

   - Custom vibration pattern editor
   - Morse code support for accessibility
   - Rhythm-based patterns

4. **AI-Powered Alerts**
   - Machine learning for optimal alert timing
   - Predictive notification preferences
   - Context-aware sound selection

## 📊 Performance Considerations

### Optimization Strategies

1. **Sound Preloading**

   - Preload frequently used sounds
   - Lazy load less common sounds
   - Cache management for memory efficiency

2. **Battery Optimization**

   - Efficient audio codec usage
   - Minimal background processing
   - Smart vibration patterns

3. **Network Efficiency**
   - Compressed audio files
   - CDN delivery for sound assets
   - Offline sound caching

## 🔒 Security & Privacy

### Data Protection

- No audio recording or transmission
- Local storage of user preferences
- Encrypted preference storage
- No tracking of audio usage patterns

### Permissions

- Minimal permission requirements
- Clear permission explanations
- Graceful degradation without permissions
- User control over all audio features

## 📈 Analytics & Monitoring

### Metrics Tracked

- Audio alert success/failure rates
- User preference patterns
- Performance metrics
- Error rates and types

### Monitoring

- Real-time error tracking
- Performance monitoring
- User experience metrics
- Platform-specific analytics

---

This audio alerts feature significantly enhances the contractor experience by providing immediate, attention-grabbing notifications for new task opportunities, ensuring contractors never miss important work assignments.
