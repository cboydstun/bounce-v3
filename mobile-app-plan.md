# Bounce Contractor Mobile App - Ionic Development Plan

## 📋 Project Overview

This document outlines the complete development plan for a cross-platform mobile application using Ionic Framework that integrates with the Bounce Mobile API Server. The app will enable contractors to discover, claim, and manage bounce house delivery/setup tasks with real-time notifications and QuickBooks integration.

## 🎯 App Features & User Stories

### **Core Functionality**

- **Contractor Authentication**: Registration, login, email verification, password reset
- **Task Discovery**: Location-based task browsing with skills filtering
- **Task Management**: Claim, update status, complete tasks with photo uploads
- **Real-time Notifications**: Live updates for new tasks, assignments, and status changes
- **QuickBooks Integration**: Connect accounting, submit W-9 forms, download PDFs
- **Profile Management**: Update skills, contact information, and preferences
- **Offline Support**: Cache critical data for offline functionality

### **User Stories**

**As a contractor, I want to:**

1. Register and verify my account to access the platform
2. Browse available tasks near my location that match my skills
3. Claim tasks that fit my schedule and expertise
4. Receive real-time notifications about new opportunities
5. Update task status as I progress through delivery/setup
6. Upload photos upon task completion for verification
7. Connect my QuickBooks account for seamless payment processing
8. Submit tax forms (W-9) digitally through the app
9. View my task history and earnings
10. Work offline when internet connectivity is limited

## 🏗️ Technical Architecture

### **Technology Stack**

- **Framework**: Ionic 7 with Angular 16+
- **Language**: TypeScript
- **UI Components**: Ionic Components + Custom Components
- **State Management**: NgRx for complex state management
- **HTTP Client**: Angular HttpClient with interceptors
- **Real-time**: Socket.io client for WebSocket connections
- **Maps**: Google Maps SDK for location services
- **Camera**: Ionic Native Camera plugin
- **Storage**: Ionic Storage for offline data
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Testing**: Jasmine + Karma for unit tests, Protractor for e2e

### **Project Structure**

```
bounce-contractor-app/
├── src/
│   ├── app/
│   │   ├── core/                    # Core services and guards
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── verification.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── loading.interceptor.ts
│   │   │   └── services/
│   │   │       ├── api.service.ts
│   │   │       ├── auth.service.ts
│   │   │       ├── storage.service.ts
│   │   │       ├── location.service.ts
│   │   │       ├── notification.service.ts
│   │   │       ├── websocket.service.ts
│   │   │       └── offline.service.ts
│   │   ├── shared/                  # Shared components and utilities
│   │   │   ├── components/
│   │   │   │   ├── task-card/
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── error-message/
│   │   │   │   ├── photo-upload/
│   │   │   │   └── map-view/
│   │   │   ├── pipes/
│   │   │   │   ├── distance.pipe.ts
│   │   │   │   ├── currency.pipe.ts
│   │   │   │   └── time-ago.pipe.ts
│   │   │   ├── models/
│   │   │   │   ├── contractor.model.ts
│   │   │   │   ├── task.model.ts
│   │   │   │   ├── notification.model.ts
│   │   │   │   └── api-response.model.ts
│   │   │   └── utils/
│   │   │       ├── validators.ts
│   │   │       ├── constants.ts
│   │   │       └── helpers.ts
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   └── email-verification/
│   │   │   │   ├── services/
│   │   │   │   └── auth.module.ts
│   │   │   ├── tasks/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── task-list/
│   │   │   │   │   ├── task-detail/
│   │   │   │   │   ├── my-tasks/
│   │   │   │   │   └── task-completion/
│   │   │   │   ├── services/
│   │   │   │   │   └── task.service.ts
│   │   │   │   └── tasks.module.ts
│   │   │   ├── profile/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── profile-view/
│   │   │   │   │   ├── profile-edit/
│   │   │   │   │   └── settings/
│   │   │   │   └── profile.module.ts
│   │   │   ├── quickbooks/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── connect/
│   │   │   │   │   ├── w9-form/
│   │   │   │   │   └── status/
│   │   │   │   ├── services/
│   │   │   │   │   └── quickbooks.service.ts
│   │   │   │   └── quickbooks.module.ts
│   │   │   └── notifications/
│   │   │       ├── pages/
│   │   │       │   └── notification-list/
│   │   │       └── notifications.module.ts
│   │   ├── store/                   # NgRx state management
│   │   │   ├── auth/
│   │   │   │   ├── auth.actions.ts
│   │   │   │   ├── auth.effects.ts
│   │   │   │   ├── auth.reducer.ts
│   │   │   │   └── auth.selectors.ts
│   │   │   ├── tasks/
│   │   │   ├── profile/
│   │   │   ├── notifications/
│   │   │   └── app.state.ts
│   │   ├── tabs/                    # Tab navigation
│   │   │   ├── tabs.page.ts
│   │   │   └── tabs.page.html
│   │   └── app.module.ts
│   ├── assets/                      # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── i18n/                    # Internationalization
│   ├── theme/                       # Styling
│   │   ├── variables.scss
│   │   └── custom.scss
│   └── environments/                # Environment configurations
│       ├── environment.ts
│       └── environment.prod.ts
├── android/                         # Android platform files
├── ios/                            # iOS platform files
├── capacitor.config.ts             # Capacitor configuration
├── ionic.config.json               # Ionic configuration
├── package.json
└── README.md
```

## 📱 User Interface Design

### **Design System**

- **Color Palette**: Primary (Bounce brand blue), Secondary (accent orange), Success (green), Warning (yellow), Danger (red)
- **Typography**: Roboto for Android, San Francisco for iOS
- **Icons**: Ionic Icons + custom SVG icons
- **Spacing**: 8px grid system
- **Components**: Material Design for Android, iOS design for iOS

### **Screen Layouts**

#### **Authentication Flow**

1. **Splash Screen**: App logo with loading indicator
2. **Onboarding**: 3-slide introduction to app features
3. **Login Screen**: Email/password with "Remember Me" option
4. **Registration Screen**: Multi-step form (personal info → skills → verification)
5. **Forgot Password**: Email input with reset instructions
6. **Email Verification**: Code input with resend option

#### **Main App Navigation (Tabs)**

1. **Tasks Tab**: Available tasks with map/list toggle
2. **My Tasks Tab**: Assigned/in-progress tasks
3. **Notifications Tab**: Real-time updates and messages
4. **Profile Tab**: Account settings and QuickBooks integration

#### **Task Management Screens**

1. **Task List**: Cards with distance, payment, skills required
2. **Task Detail**: Full description, map, claim button
3. **Task Progress**: Status updates, timer, notes
4. **Task Completion**: Photo upload, completion notes
5. **Task History**: Past completed tasks with earnings

#### **Profile & Settings**

1. **Profile Overview**: Photo, name, skills, rating
2. **Edit Profile**: Update personal information and skills
3. **QuickBooks Integration**: Connection status, W-9 form
4. **Settings**: Notifications, location, app preferences

## 🔧 Development Phases

### **Phase 1: Project Setup & Core Infrastructure (Week 1)**

#### **Day 1-2: Project Initialization**

```bash
# Install Ionic CLI
npm install -g @ionic/cli

# Create new Ionic app
ionic start bounce-contractor-app tabs --type=angular --capacitor

# Add required dependencies
npm install @ngrx/store @ngrx/effects @ngrx/store-devtools
npm install socket.io-client
npm install @ionic/storage-angular
npm install @capacitor/camera @capacitor/geolocation
npm install @capacitor/push-notifications
npm install @angular/google-maps
```

#### **Day 3-4: Core Services Setup**

- **API Service**: HTTP client with base URL configuration
- **Auth Service**: Login, register, token management
- **Storage Service**: Secure token storage and offline data
- **Location Service**: GPS tracking and distance calculations
- **WebSocket Service**: Real-time connection management

#### **Day 5-7: Authentication Module**

- **Login Page**: Email/password form with validation
- **Registration Page**: Multi-step contractor registration
- **Auth Guards**: Route protection and verification checks
- **Token Interceptor**: Automatic JWT token attachment
- **Error Handling**: User-friendly error messages

### **Phase 2: Task Discovery & Management (Week 2)**

#### **Day 8-10: Task List & Discovery**

- **Task List Page**: Available tasks with filtering
- **Map Integration**: Google Maps with task markers
- **Location Filtering**: Radius-based task discovery
- **Skills Matching**: Filter tasks by contractor skills
- **Pagination**: Infinite scroll for large task lists

#### **Day 11-12: Task Detail & Claiming**

- **Task Detail Page**: Complete task information
- **Claim Functionality**: Atomic task claiming with conflict handling
- **Distance Calculation**: Real-time distance to task location
- **Availability Check**: Real-time task status updates

#### **Day 13-14: My Tasks Management**

- **My Tasks Page**: Assigned and in-progress tasks
- **Status Updates**: Progress tracking and status changes
- **Task Timer**: Time tracking for task completion
- **Notes System**: Add notes and updates to tasks

### **Phase 3: Real-time Features & Notifications (Week 3)**

#### **Day 15-17: WebSocket Integration**

- **Socket Connection**: Authenticated WebSocket connection
- **Real-time Events**: Task updates, new tasks, assignments
- **Connection Management**: Automatic reconnection and error handling
- **Room Management**: Location and skill-based subscriptions

#### **Day 18-19: Push Notifications**

- **FCM Setup**: Firebase Cloud Messaging integration
- **Notification Service**: Local and push notification handling
- **Notification Preferences**: User-configurable notification settings
- **Background Sync**: Sync data when app is backgrounded

#### **Day 20-21: Notification Management**

- **Notification List**: In-app notification history
- **Notification Actions**: Quick actions from notifications
- **Badge Management**: App icon badge for unread notifications

### **Phase 4: Task Completion & Photo Upload (Week 4)**

#### **Day 22-24: Photo Upload System**

- **Camera Integration**: Native camera access
- **Photo Gallery**: Select from device gallery
- **Image Compression**: Optimize images for upload
- **Multiple Photos**: Support for multiple task completion photos
- **Upload Progress**: Visual feedback for upload status

#### **Day 25-26: Task Completion Flow**

- **Completion Form**: Notes and photo upload
- **Validation**: Ensure required photos and information
- **Offline Support**: Queue completions for later upload
- **Success Feedback**: Confirmation and next steps

#### **Day 27-28: Task History & Earnings**

- **History Page**: Completed tasks with details
- **Earnings Tracking**: Payment information and totals
- **Export Functionality**: Export task history for records

### **Phase 5: QuickBooks Integration (Week 5)**

#### **Day 29-31: QuickBooks Connection**

- **OAuth Flow**: In-app browser for QuickBooks authentication
- **Connection Status**: Display connection state and company info
- **Token Management**: Secure storage and refresh handling
- **Disconnect Option**: Remove QuickBooks integration

#### **Day 32-33: W-9 Form Submission**

- **W-9 Form**: Digital tax form with validation
- **Form Persistence**: Save draft forms locally
- **PDF Generation**: Generate and download W-9 PDFs
- **Submission Status**: Track form submission progress

#### **Day 34-35: Integration Status & Management**

- **Status Dashboard**: QuickBooks connection overview
- **Sync Status**: Contractor information synchronization
- **Error Handling**: Handle QuickBooks API errors gracefully

### **Phase 6: Profile Management & Settings (Week 6)**

#### **Day 36-37: Profile Management**

- **Profile View**: Display contractor information
- **Edit Profile**: Update personal information and skills
- **Photo Upload**: Profile picture management
- **Skills Management**: Add/remove contractor skills

#### **Day 38-39: Settings & Preferences**

- **App Settings**: Notification preferences, location settings
- **Account Settings**: Password change, email updates
- **Privacy Settings**: Data sharing and privacy controls
- **About & Help**: App information and support links

#### **Day 40-42: Offline Support & Sync**

- **Offline Storage**: Cache critical data locally
- **Sync Management**: Background data synchronization
- **Conflict Resolution**: Handle offline/online data conflicts
- **Offline Indicators**: Show offline status and capabilities

### **Phase 7: Testing & Optimization (Week 7)**

#### **Day 43-45: Testing Implementation**

- **Unit Tests**: Service and component testing
- **Integration Tests**: API integration testing
- **E2E Tests**: Complete user flow testing
- **Performance Testing**: Memory and battery optimization

#### **Day 46-47: Platform-Specific Features**

- **iOS Optimization**: iOS-specific UI and functionality
- **Android Optimization**: Android-specific features
- **Platform Testing**: Test on multiple devices and OS versions

#### **Day 48-49: Final Polish & Bug Fixes**

- **UI/UX Polish**: Final design refinements
- **Bug Fixes**: Address testing feedback
- **Performance Optimization**: Improve app performance
- **Accessibility**: Ensure app accessibility compliance

## 🔌 API Integration

### **HTTP Client Configuration**

```typescript
// src/app/core/services/api.service.ts
@Injectable({
  providedIn: "root",
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Authentication
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/auth/contractor/register`,
      data,
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/auth/contractor/login`,
      credentials,
    );
  }

  refreshToken(token: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.baseUrl}/auth/contractor/refresh`,
      { refreshToken: token },
    );
  }

  // Tasks
  getAvailableTasks(params: TaskFilters): Observable<TaskListResponse> {
    return this.http.get<TaskListResponse>(`${this.baseUrl}/tasks/available`, {
      params,
    });
  }

  getMyTasks(params?: TaskFilters): Observable<TaskListResponse> {
    return this.http.get<TaskListResponse>(`${this.baseUrl}/tasks/my-tasks`, {
      params,
    });
  }

  claimTask(taskId: string): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(
      `${this.baseUrl}/tasks/${taskId}/claim`,
      {},
    );
  }

  updateTaskStatus(
    taskId: string,
    status: TaskStatus,
  ): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(
      `${this.baseUrl}/tasks/${taskId}/status`,
      { status },
    );
  }

  completeTask(
    taskId: string,
    data: TaskCompletionData,
  ): Observable<TaskResponse> {
    const formData = new FormData();
    formData.append("notes", data.notes);
    data.photos.forEach((photo) => formData.append("photos", photo));
    return this.http.post<TaskResponse>(
      `${this.baseUrl}/tasks/${taskId}/complete`,
      formData,
    );
  }

  // QuickBooks
  connectQuickBooks(): Observable<QuickBooksAuthResponse> {
    return this.http.post<QuickBooksAuthResponse>(
      `${this.baseUrl}/quickbooks/connect`,
      {},
    );
  }

  submitW9Form(formData: W9FormData): Observable<W9Response> {
    return this.http.post<W9Response>(
      `${this.baseUrl}/quickbooks/w9/submit`,
      formData,
    );
  }
}
```

### **WebSocket Integration**

```typescript
// src/app/core/services/websocket.service.ts
@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private socket: Socket;
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.getAccessToken();
    this.socket = io(environment.apiUrl, {
      auth: { token },
    });

    this.socket.on("connect", () => {
      this.connected$.next(true);
      this.subscribeToContractorRoom();
    });

    this.socket.on("disconnect", () => {
      this.connected$.next(false);
    });

    // Task events
    this.socket.on("task:new", (task) => {
      this.handleNewTask(task);
    });

    this.socket.on("task:assigned", (task) => {
      this.handleTaskAssigned(task);
    });

    this.socket.on("notification:personal", (notification) => {
      this.handlePersonalNotification(notification);
    });
  }

  updateLocation(lat: number, lng: number): void {
    this.socket.emit("contractor:location-update", { lat, lng });
  }

  private subscribeToContractorRoom(): void {
    const contractorId = this.authService.getContractorId();
    this.socket.emit("join-room", `contractor:${contractorId}`);
  }
}
```

## 📱 Native Features Integration

### **Camera & Photo Upload**

```typescript
// src/app/shared/components/photo-upload/photo-upload.component.ts
@Component({
  selector: "app-photo-upload",
  template: `
    <ion-button (click)="takePhoto()" fill="outline">
      <ion-icon name="camera" slot="start"></ion-icon>
      Take Photo
    </ion-button>
    <ion-button (click)="selectFromGallery()" fill="outline">
      <ion-icon name="images" slot="start"></ion-icon>
      Select from Gallery
    </ion-button>
    <div class="photo-grid">
      <div *ngFor="let photo of photos" class="photo-item">
        <img [src]="photo.webPath" />
        <ion-button (click)="removePhoto(photo)" size="small" color="danger">
          <ion-icon name="close"></ion-icon>
        </ion-button>
      </div>
    </div>
  `,
})
export class PhotoUploadComponent {
  @Output() photosChanged = new EventEmitter<Photo[]>();
  photos: Photo[] = [];

  async takePhoto(): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      this.addPhoto(image);
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  }

  async selectFromGallery(): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      this.addPhoto(image);
    } catch (error) {
      console.error("Error selecting photo:", error);
    }
  }

  private addPhoto(image: Photo): void {
    this.photos.push(image);
    this.photosChanged.emit(this.photos);
  }
}
```

### **Location Services**

```typescript
// src/app/core/services/location.service.ts
@Injectable({
  providedIn: "root",
})
export class LocationService {
  private currentPosition$ = new BehaviorSubject<Position | null>(null);

  async getCurrentPosition(): Promise<Position> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      this.currentPosition$.next(position);
      return position;
    } catch (error) {
      throw new Error("Unable to get current location");
    }
  }

  watchPosition(): Observable<Position> {
    return new Observable((observer) => {
      const watchId = Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
        (position, err) => {
          if (err) {
            observer.error(err);
          } else if (position) {
            observer.next(position);
          }
        },
      );

      return () => Geolocation.clearWatch({ id: watchId });
    });
  }

  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
```

### **Push Notifications**

```typescript
// src/app/core/services/notification.service.ts
@Injectable({
  providedIn: "root",
})
export class NotificationService {
  constructor(
    private platform: Platform,
    private localNotifications: LocalNotifications,
  ) {}

  async initializePushNotifications(): Promise<void> {
    if (this.platform.is("capacitor")) {
      await this.requestPermissions();
      await this.registerForPushNotifications();
    }
  }

  private async requestPermissions(): Promise<void> {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== "granted") {
      throw new Error("Push notification permission denied");
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    await PushNotifications.register();

    PushNotifications.addListener("registration", (token) => {
      console.log("Push registration success, token: " + token.value);
      // Send token to backend
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.error("Error on registration: " + JSON.stringify(error));
    });

    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        this.handlePushNotification(notification);
      },
    );

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        this.handleNotificationAction(notification);
      },
    );
  }

  async showLocalNotification(
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    await this.localNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          extra: data,
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    });
  }
}
```

## 🎨 UI/UX Implementation

### **Task Card Component**

```typescript
// src/app/shared/components/task-card/task-card.component.ts
@Component({
  selector: "app-task-card",
  template: `
    <ion-card (click)="onTaskClick()">
      <ion-card-header>
        <ion-card-subtitle>
          <ion-icon name="location-outline"></ion-icon>
          {{ task.distance | distance }} away
        </ion-card-subtitle>
        <ion-card-title>{{ task.title }}</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <p>{{ task.description }}</p>

        <div class="task-details">
          <div class="payment">
            <ion-icon name="cash-outline"></ion-icon>
            {{ task.payment.amount | currency }}
          </div>

          <div class="duration">
            <ion-icon name="time-outline"></ion-icon>
            {{ task.estimatedDuration }}min
          </div>

          <div class="date">
            <ion-icon name="calendar-outline"></ion-icon>
            {{ task.scheduledDate | date: "short" }}
          </div>
        </div>

        <div class="skills-required">
          <ion-chip *ngFor="let skill of task.skillsRequired" color="primary">
            {{ skill }}
          </ion-chip>
        </div>
      </ion-card-content>

      <ion-card-content>
        <ion-button
          expand="block"
          (click)="onClaimTask($event)"
          [disabled]="task.status !== 'Pending'"
        >
          {{ getButtonText() }}
        </ion-button>
      </ion-card-content>
    </ion-card>
  `,
  styleUrls: ["./task-card.component.scss"],
})
export class TaskCardComponent {
  @Input() task: Task;
  @Output() taskClicked = new EventEmitter<Task>();
  @Output() taskClaimed = new EventEmitter<Task>();

  onTaskClick(): void {
    this.taskClicked.emit(this.task);
  }

  onClaimTask(event: Event): void {
    event.stopPropagation();
    this.taskClaimed.emit(this.task);
  }

  getButtonText(): string {
    switch (this.task.status) {
      case "Pending":
        return "Claim Task";
      case "Assigned":
        return "Already Claimed";
      case "In Progress":
        return "In Progress";
      case "Completed":
        return "Completed";
      default:
        return "Unavailable";
    }
  }
}
```

### **Map View Component**

```typescript
// src/app/shared/components/map-view/map-view.component.ts
@Component({
  selector: "app-map-view",
  template: `
    <google-map
      [center]="center"
      [zoom]="zoom"
      [options]="mapOptions"
      (mapClick)="onMapClick($event)"
    >
      <map-marker
        *ngFor="let task of tasks"
        [position]="getTaskPosition(task)"
        [options]="getMarkerOptions(task)"
        (mapClick)="onTaskMarkerClick(task)"
      >
      </map-marker>

      <map-marker
        *ngIf="userLocation"
        [position]="userLocation"
        [options]="userMarkerOptions"
      >
      </map-marker>
    </google-map>
  `,
  styleUrls: ["./map-view.component.scss"],
})
export class MapViewComponent implements OnInit {
  @Input() tasks: Task[] = [];
  @Input() userLocation: google.maps.LatLngLiteral | null = null;
  @Output() taskSelected = new EventEmitter<Task>();

  center: google.maps.LatLngLiteral = { lat: 29.4241, lng: -98.4936 }; // San Antonio
  zoom = 12;

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  userMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: "assets/icons/user-location.png",
      scaledSize: new google.maps.Size(30, 30),
    },
  };

  ngOnInit(): void {
    if (this.userLocation) {
      this.center = this.userLocation;
    }
  }

  getTaskPosition(task: Task): google.maps.LatLngLiteral {
    return {
      lat: task.location.coordinates[1],
      lng: task.location.coordinates[0],
    };
  }

  getMarkerOptions(task: Task): google.maps.MarkerOptions {
    return {
      icon: {
        url: this.getMarkerIcon(task),
        scaledSize: new google.maps.Size(25, 25),
      },
    };
  }

  private getMarkerIcon(task: Task): string {
    switch (task.status) {
      case "Pending":
        return "assets/icons/task-available.png";
      case "Assigned":
        return "assets/icons/task-assigned.png";
      default:
        return "assets/icons/task-default.png";
    }
  }

  onTaskMarkerClick(task: Task): void {
    this.taskSelected.emit(task);
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    // Handle map click if needed
  }
}
```

## 🔄 State Management (NgRx)

### **Auth State**

```typescript
// src/app/store/auth/auth.actions.ts
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ credentials: LoginCredentials }>(),
    'Login Success': props<{ response: AuthResponse }>(),
    'Login Failure': props<{ error: string }>(),
    'Register': props<{ data: RegisterData }>(),
    'Register Success': props<{ response: AuthResponse }>(),
    'Register Failure': props<{ error: string }>(),
    'Logout': emptyProps(),
    'Refresh Token': props<{ refreshToken: string }>(),
```
