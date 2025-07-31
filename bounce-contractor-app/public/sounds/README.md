# Audio Alert Sound Files

This directory contains audio files for the contractor app's alert system. Each sound file corresponds to different types of notifications and task priorities.

## Required Sound Files

### New Task Alerts

- `new-task-low.mp3` - Gentle notification sound for low priority tasks
- `new-task-medium.mp3` - Standard notification sound for medium priority tasks
- `new-task-high.mp3` - Attention-grabbing sound for high priority tasks
- `new-task-urgent.mp3` - Urgent, repeating sound for critical tasks

### Task Status Alerts

- `task-assigned.mp3` - Confirmation sound when a task is assigned
- `task-completed.mp3` - Success sound when a task is completed

### General Notifications

- `notification.mp3` - Standard notification sound for general alerts
- `alert-critical.mp3` - Critical alert sound for system-wide important messages

## File Requirements

- **Format**: MP3 (preferred) or OGG/WAV for web compatibility
- **Duration**: 1-4 seconds (short and attention-grabbing)
- **Quality**: 44.1kHz, 16-bit minimum
- **Volume**: Normalized to prevent clipping
- **Size**: Keep files under 100KB each for fast loading

## Sound Design Guidelines

### Low Priority (`new-task-low.mp3`)

- Soft, pleasant tone
- Single chime or bell sound
- Duration: ~1.5 seconds
- Volume: Moderate

### Medium Priority (`new-task-medium.mp3`)

- Clear, noticeable sound
- Two-tone chime or notification sound
- Duration: ~2 seconds
- Volume: Standard

### High Priority (`new-task-high.mp3`)

- More urgent, attention-grabbing
- Three-tone sequence or ascending notes
- Duration: ~2.5 seconds
- Volume: Louder than medium

### Urgent Priority (`new-task-urgent.mp3`)

- Immediate attention required
- Rapid sequence or alarm-like sound
- Duration: ~3 seconds
- Volume: Maximum (but not harsh)
- May repeat automatically

### Task Assigned (`task-assigned.mp3`)

- Positive, confirmatory sound
- Success chime or ding
- Duration: ~1.8 seconds

### Task Completed (`task-completed.mp3`)

- Achievement/completion sound
- Satisfying resolution tone
- Duration: ~2.2 seconds

### General Notification (`notification.mp3`)

- Neutral, informative sound
- Simple notification tone
- Duration: ~1 second

### Critical Alert (`alert-critical.mp3`)

- Urgent system alert
- Attention-demanding sound
- Duration: ~4 seconds
- May include multiple tones

## Implementation Notes

- Sounds are loaded and cached by the AudioService
- Web Audio API is used when available for better performance
- Fallback to HTML5 audio for broader compatibility
- Sounds respect system volume and silent mode settings
- Each sound can be individually enabled/disabled in user preferences

## Testing

Use the audio service's `testAudio()` method to preview sounds:

```typescript
import { audioService } from "../services/audio/audioService";

// Test a specific sound
await audioService.testAudio("new_task_urgent");
```

## Placeholder Files

Until actual sound files are provided, the app will gracefully handle missing files by:

1. Logging warnings for missing sounds
2. Falling back to system notification sounds
3. Still triggering vibration patterns when available
