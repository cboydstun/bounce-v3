# Bounce Contractor Mobile App - Ionic Development Plan (Complete)

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
- **Testing**: Jasmine + Karma for unit tests, Cypress for e2e

### **Environment Configuration**

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:4000",
  wsUrl: "ws://localhost:4000",
  googleMapsApiKey: "your-google-maps-api-key",
  firebaseConfig: {
    // Firebase configuration
  },
  rateLimitConfig: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
  },
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: "https://api.yourdomain.com",
  wsUrl: "wss://api.yourdomain.com",
  googleMapsApiKey: "your-production-google-maps-api-key",
  firebaseConfig: {
    // Production Firebase configuration
  },
  rateLimitConfig: {
    windowMs: 900000,
    maxRequests: 100,
  },
};
```

## 🔌 API Integration (Aligned with Server Documentation)

### **Authentication Service**

```typescript
// src/app/core/services/auth.service.ts
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = "access_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router,
  ) {}

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.http
      .post<ApiResponse<AuthResponse>>(
        `${environment.apiUrl}/api/auth/contractor/register`,
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          skills: data.skills,
        },
      )
      .toPromise();

    if (response.success) {
      await this.storeTokens(
        response.data.accessToken,
        response.data.refreshToken,
      );
      return response.data;
    }
    throw new Error(response.error?.message || "Registration failed");
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.http
      .post<ApiResponse<AuthResponse>>(
        `${environment.apiUrl}/api/auth/contractor/login`,
        {
          email: credentials.email,
          password: credentials.password,
        },
      )
      .toPromise();

    if (response.success) {
      await this.storeTokens(
        response.data.accessToken,
        response.data.refreshToken,
      );
      return response.data;
    }
    throw new Error(response.error?.message || "Login failed");
  }

  async refreshToken(): Promise<string> {
    const refreshToken = await this.storage.get(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await this.http
      .post<
        ApiResponse<TokenResponse>
      >(`${environment.apiUrl}/api/auth/contractor/refresh`, { refreshToken })
      .toPromise();

    if (response.success) {
      await this.storage.set(this.ACCESS_TOKEN_KEY, response.data.accessToken);
      return response.data.accessToken;
    }
    throw new Error("Token refresh failed");
  }

  async logout(): Promise<void> {
    try {
      await this.http
        .post(`${environment.apiUrl}/api/auth/contractor/logout`, {})
        .toPromise();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await this.clearTokens();
      this.router.navigate(["/auth/login"]);
    }
  }

  private async storeTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    await Promise.all([
      this.storage.set(this.ACCESS_TOKEN_KEY, accessToken),
      this.storage.set(this.REFRESH_TOKEN_KEY, refreshToken),
    ]);
  }

  private async clearTokens(): Promise<void> {
    await Promise.all([
      this.storage.remove(this.ACCESS_TOKEN_KEY),
      this.storage.remove(this.REFRESH_TOKEN_KEY),
    ]);
  }
}
```

### **Task Service (Exact API Endpoints)**

```typescript
// src/app/features/tasks/services/task.service.ts
@Injectable({
  providedIn: "root",
})
export class TaskService {
  constructor(private http: HttpClient) {}

  getAvailableTasks(filters: TaskFilters): Observable<TaskListResponse> {
    const params = new HttpParams()
      .set("skills", filters.skills?.join(",") || "")
      .set("lat", filters.lat?.toString() || "")
      .set("lng", filters.lng?.toString() || "")
      .set("radius", filters.radius?.toString() || "50")
      .set("page", filters.page?.toString() || "1")
      .set("limit", filters.limit?.toString() || "20");

    return this.http
      .get<
        ApiResponse<TaskListResponse>
      >(`${environment.apiUrl}/api/tasks/available`, { params })
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.error?.message || "Failed to fetch tasks");
        }),
      );
  }

  getMyTasks(filters?: TaskFilters): Observable<TaskListResponse> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set("status", filters.status);
    }
    if (filters?.page) {
      params = params.set("page", filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set("limit", filters.limit.toString());
    }

    return this.http
      .get<
        ApiResponse<TaskListResponse>
      >(`${environment.apiUrl}/api/tasks/my-tasks`, { params })
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(
            response.error?.message || "Failed to fetch my tasks",
          );
        }),
      );
  }

  claimTask(taskId: string): Observable<Task> {
    return this.http
      .post<
        ApiResponse<Task>
      >(`${environment.apiUrl}/api/tasks/${taskId}/claim`, {})
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.error?.message || "Failed to claim task");
        }),
      );
  }

  updateTaskStatus(taskId: string, status: TaskStatus): Observable<Task> {
    return this.http
      .put<
        ApiResponse<Task>
      >(`${environment.apiUrl}/api/tasks/${taskId}/status`, { status })
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(
            response.error?.message || "Failed to update task status",
          );
        }),
      );
  }

  completeTask(taskId: string, data: TaskCompletionData): Observable<Task> {
    const formData = new FormData();
    formData.append("notes", data.notes);
    data.photos.forEach((photo, index) => {
      formData.append("photos", photo, `photo_${index}.jpg`);
    });

    return this.http
      .post<
        ApiResponse<Task>
      >(`${environment.apiUrl}/api/tasks/${taskId}/complete`, formData)
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.error?.message || "Failed to complete task");
        }),
      );
  }
}
```

### **WebSocket Service (Exact Events)**

```typescript
// src/app/core/services/websocket.service.ts
@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private socket: Socket;
  private connected$ = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event subjects
  private taskEvents$ = new Subject<TaskEvent>();
  private notificationEvents$ = new Subject<NotificationEvent>();

  constructor(
    private authService: AuthService,
    private store: Store,
  ) {}

  async connect(): Promise<void> {
    const token = await this.authService.getAccessToken();
    if (!token) {
      throw new Error("No access token available for WebSocket connection");
    }

    this.socket = io(environment.wsUrl, {
      auth: { token },
      transports: ["websocket"],
      upgrade: false,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected$.next(false);
    }
  }

  // Observable streams for components to subscribe to
  getTaskEvents(): Observable<TaskEvent> {
    return this.taskEvents$.asObservable();
  }

  getNotificationEvents(): Observable<NotificationEvent> {
    return this.notificationEvents$.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  // Emit events to server
  updateLocation(lat: number, lng: number): void {
    if (this.socket && this.connected$.value) {
      this.socket.emit("contractor:location-update", { lat, lng });
    }
  }

  private setupEventListeners(): void {
    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.connected$.next(true);
      this.reconnectAttempts = 0;
      this.subscribeToContractorRoom();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.connected$.next(false);
      this.handleReconnection();
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.handleReconnection();
    });

    // Task events (exact from API documentation)
    this.socket.on("task:new", (task) => {
      this.taskEvents$.next({ type: "new", data: task });
    });

    this.socket.on("task:assigned", (task) => {
      this.taskEvents$.next({ type: "assigned", data: task });
    });

    this.socket.on("task:updated", (task) => {
      this.taskEvents$.next({ type: "updated", data: task });
    });

    this.socket.on("task:claimed", (task) => {
      this.taskEvents$.next({ type: "claimed", data: task });
    });

    this.socket.on("task:completed", (task) => {
      this.taskEvents$.next({ type: "completed", data: task });
    });

    this.socket.on("task:cancelled", (task) => {
      this.taskEvents$.next({ type: "cancelled", data: task });
    });

    // Notification events (exact from API documentation)
    this.socket.on("notification:system", (notification) => {
      this.notificationEvents$.next({ type: "system", data: notification });
    });

    this.socket.on("notification:personal", (notification) => {
      this.notificationEvents$.next({ type: "personal", data: notification });
    });

    // Connection events (exact from API documentation)
    this.socket.on("connection:established", () => {
      console.log("WebSocket connection established");
    });

    this.socket.on("ping", () => {
      this.socket.emit("pong");
    });
  }

  private async subscribeToContractorRoom(): Promise<void> {
    const contractorId = await this.authService.getContractorId();
    if (contractorId) {
      this.socket.emit("join-room", `contractor:${contractorId}`);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

      setTimeout(() => {
        console.log(
          `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        );
        this.connect();
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }
}
```

### **Error Handling (Standardized)**

```typescript
// src/app/core/services/error-handler.service.ts
@Injectable({
  providedIn: "root",
})
export class ErrorHandlerService {
  constructor(private toastController: ToastController) {}

  handleApiError(error: ApiError): void {
    const errorMessage = this.getErrorMessage(error);
    this.showErrorToast(errorMessage);

    // Log error for debugging
    console.error("API Error:", error);

    // Handle specific error codes from API documentation
    switch (error.code) {
      case "VALIDATION_ERROR":
        this.handleValidationError(error);
        break;
      case "UNAUTHORIZED":
        // Redirect to login
        break;
      case "FORBIDDEN":
        this.showForbiddenMessage();
        break;
      case "NOT_FOUND":
        this.showNotFoundMessage();
        break;
      case "CONFLICT":
        this.showConflictMessage(error);
        break;
      case "RATE_LIMIT_EXCEEDED":
        this.showRateLimitMessage();
        break;
      case "INTERNAL_ERROR":
        this.showInternalErrorMessage();
        break;
    }
  }

  private getErrorMessage(error: ApiError): string {
    // Error messages matching API server documentation
    const errorMessages = {
      VALIDATION_ERROR: "Please check your input and try again",
      UNAUTHORIZED: "Please log in to continue",
      FORBIDDEN: "You don't have permission to perform this action",
      NOT_FOUND: "The requested resource was not found",
      CONFLICT: "This action conflicts with current data",
      RATE_LIMIT_EXCEEDED: "Too many requests. Please wait before trying again",
      INTERNAL_ERROR: "Something went wrong. Please try again later",
    };

    return (
      errorMessages[error.code] ||
      error.message ||
      "An unexpected error occurred"
    );
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: "danger",
      position: "top",
    });
    await toast.present();
  }

  private async showRateLimitMessage(): Promise<void> {
    const alert = await this.alertController.create({
      header: "Rate Limit Exceeded",
      message:
        "You've made too many requests. Please wait 15 minutes before trying again.",
      buttons: ["OK"],
    });
    await alert.present();
  }

  private handleValidationError(error: ApiError): void {
    if (error.details) {
      const fieldError = `${error.details.field}: ${error.details.issue}`;
      this.showErrorToast(fieldError);
    }
  }
}
```

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
npm install @capacitor/app @capacitor/haptics
npm install @capacitor/network @capacitor/status-bar
npm install @ionic-native/in-app-browser
```

#### **Day 3-4: Environment & Configuration**

- **Environment Files**: Development, staging, and production configurations
- **Capacitor Configuration**: Platform-specific settings
- **Firebase Setup**: Push notifications and analytics
- **Google Maps Integration**: API key configuration

#### **Day 5-7: Core Services & Guards**

- **API Service**: HTTP client with base URL configuration
- **Auth Service**: JWT token management with 15-minute access tokens
- **Storage Service**: Secure token storage and offline data
- **Location Service**: GPS tracking and distance calculations
- **WebSocket Service**: Real-time connection management
- **Error Handler Service**: Standardized error handling
- **Auth Guards**: Route protection and verification checks

### **Phase 2: Authentication & Security (Week 2)**

#### **Day 8-10: Authentication Flow**

- **Login Page**: Email/password form with validation
- **Registration Page**: Multi-step contractor registration matching API
- **Email Verification**: Code input with resend functionality
- **Forgot Password**: Email reset flow
- **Token Management**: Automatic refresh with 15-minute expiry

#### **Day 11-12: HTTP Interceptors**

- **Auth Interceptor**: Automatic JWT token attachment
- **Error Interceptor**: Centralized error handling with token refresh
- **Loading Interceptor**: Global loading states
- **Rate Limit Interceptor**: Handle 429 responses gracefully

#### **Day 13-14: Security Implementation**

- **Secure Storage**: Encrypted token storage
- **Biometric Authentication**: Fingerprint/Face ID support
- **Session Management**: Automatic logout on token expiry
- **Security Headers**: Implement security best practices

### **Phase 3: Task Management & Real-time Features (Week 3)**

#### **Day 15-17: Task Discovery**

- **Task List Page**: Available tasks with filtering matching API response format
- **Map Integration**: Google Maps with task markers
- **Location Filtering**: Radius-based task discovery (50-mile default)
- **Skills Matching**: Filter tasks by contractor skills
- **Pagination**: Infinite scroll with 20 items per page

#### **Day 18-19: Task Management**

- **Task Detail Page**: Complete task information display
- **Claim Functionality**: Atomic task claiming with conflict handling
- **My Tasks Page**: Assigned and in-progress tasks
- **Status Updates**: Progress tracking matching API status values
- **Real-time Updates**: WebSocket integration for live task changes

#### **Day 20-21: WebSocket Integration**

- **Connection Management**: Authenticated WebSocket with auto-reconnection
- **Event Handling**: All task and notification events from API
- **Room Subscriptions**: Contractor-specific event rooms
- **Offline Handling**: Queue events when disconnected

### **Phase 4: Photo Upload & Task Completion (Week 4)**

#### **Day 22-24: Enhanced Photo Upload**

```typescript
// src/app/shared/components/photo-upload/photo-upload.component.ts
@Component({
  selector: "app-photo-upload",
  template: `
    <div class="photo-upload-container">
      <div class="upload-actions">
        <ion-button (click)="takePhoto()" fill="outline" expand="block">
          <ion-icon name="camera" slot="start"></ion-icon>
          Take Photo
        </ion-button>
        <ion-button (click)="selectFromGallery()" fill="outline" expand="block">
          <ion-icon name="images" slot="start"></ion-icon>
          Select from Gallery
        </ion-button>
      </div>

      <div class="photo-grid" *ngIf="photos.length > 0">
        <div *ngFor="let photo of photos; let i = index" class="photo-item">
          <img [src]="photo.webPath" [alt]="'Photo ' + (i + 1)" />
          <div class="photo-overlay">
            <ion-button
              (click)="removePhoto(i)"
              size="small"
              color="danger"
              fill="clear"
            >
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </div>
          <div class="upload-progress" *ngIf="photo.uploading">
            <ion-progress-bar [value]="photo.progress"></ion-progress-bar>
          </div>
        </div>
      </div>

      <div class="upload-info">
        <p>{{ photos.length }}/{{ maxPhotos }} photos selected</p>
        <p *ngIf="photos.length === 0" class="help-text">
          Add photos to document task completion
        </p>
      </div>
    </div>
  `,
  styleUrls: ["./photo-upload.component.scss"],
})
export class PhotoUploadComponent {
  @Input() maxPhotos = 5;
  @Input() maxFileSize = 10 * 1024 * 1024; // 10MB (matching API limit)
  @Output() photosChanged = new EventEmitter<Photo[]>();
  @Output() uploadProgress = new EventEmitter<number>();

  photos: Photo[] = [];

  constructor(
    private platform: Platform,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
  ) {}

  async takePhoto(): Promise<void> {
    if (this.photos.length >= this.maxPhotos) {
      await this.showMaxPhotosAlert();
      return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024,
      });

      await this.addPhoto(image);
    } catch (error) {
      console.error("Error taking photo:", error);
      await this.showErrorAlert("Failed to take photo");
    }
  }

  async selectFromGallery(): Promise<void> {
    if (this.photos.length >= this.maxPhotos) {
      await this.showMaxPhotosAlert();
      return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        width: 1024,
        height: 1024,
      });

      await this.addPhoto(image);
    } catch (error) {
      console.error("Error selecting photo:", error);
      await this.showErrorAlert("Failed to select photo");
    }
  }

  private async addPhoto(image: Photo): Promise<void> {
    // Validate file size
    if (
      image.format &&
      (await this.getFileSize(image.path)) > this.maxFileSize
    ) {
      await this.showFileSizeAlert();
      return;
    }

    // Add photo with upload tracking
    const photoWithProgress = {
      ...image,
      uploading: false,
      progress: 0,
    };

    this.photos.push(photoWithProgress);
    this.photosChanged.emit(this.photos);
  }

  removePhoto(index: number): void {
    this.photos.splice(index, 1);
    this.photosChanged.emit(this.photos);
  }

  private async showMaxPhotosAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: "Maximum Photos Reached",
      message: `You can only upload ${this.maxPhotos} photos per task.`,
      buttons: ["OK"],
    });
    await alert.present();
  }

  private async showFileSizeAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: "File Too Large",
      message: "Photo must be smaller than 10MB.",
      buttons: ["OK"],
    });
    await alert.present();
  }

  private async showErrorAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: "Error",
      message,
      buttons: ["OK"],
    });
    await alert.present();
  }

  private async getFileSize(path: string): Promise<number> {
    // Implementation to get file size
    return 0; // Placeholder
  }
}
```

#### **Day 25-26: Task Completion Flow**

- **Completion Form**: Notes and photo upload matching API format
- **Validation**: Ensure required photos and information
- **Upload Progress**: Visual feedback for photo uploads
- **Offline Support**: Queue completions for later upload
- **Success Feedback**: Confirmation and next steps

#### **Day 27-28: Task History & Earnings**

- **History Page**: Completed tasks with details
- **Earnings Tracking**: Payment information and totals
- **Export Functionality**: Export task history for records
- **Performance Metrics**: Task completion statistics

### **Phase 5: QuickBooks Integration (Week 5)**

#### **Day 29-31: QuickBooks Connection**

```typescript
// src/app/features/quickbooks/services/quickbooks.service.ts
@Injectable({
  providedIn: "root",
})
export class QuickBooksService {
  constructor(
    private http: HttpClient,
    private inAppBrowser: InAppBrowser,
  ) {}

  async connectQuickBooks(): Promise<string> {
    const response = await this.http
      .post<
        ApiResponse<QuickBooksAuthResponse>
      >(`${environment.apiUrl}/api/quickbooks/connect`, {})
      .toPromise();

    if (response.success) {
      return this.openAuthWindow(response.data.authUrl);
    }
    throw new Error(
      response.error?.message || "Failed to initiate QuickBooks connection",
    );
  }

  submitW9Form(formData: W9FormData): Observable<W9Response> {
    return this.http
      .post<ApiResponse<W9Response>>(
        `${environment.apiUrl}/api/quickbooks/w9/submit`,
        {
          taxClassification: formData.taxClassification,
          name: formData.name,
          businessName: formData.businessName,
          taxId: formData.taxId,
          address: {
            street: formData.address.street,
            city: formData.address.city,
            state: formData.address.state,
            zipCode: formData.address.zipCode,
          },
          signature: formData.signature,
          signatureDate: formData.signatureDate,
        },
      )
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(
            response.error?.message || "Failed to submit W-9 form",
          );
        }),
      );
  }

  downloadW9PDF(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/api/quickbooks/w9/download`, {
      responseType: "blob",
    });
  }

  getQuickBooksStatus(): Observable<QuickBooksStatus> {
    return this.http
      .get<
        ApiResponse<QuickBooksStatus>
      >(`${environment.apiUrl}/api/quickbooks/status`)
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(
            response.error?.message || "Failed to get QuickBooks status",
          );
        }),
      );
  }

  disconnectQuickBooks(): Observable<void> {
    return this.http
      .post<
        ApiResponse<void>
      >(`${environment.apiUrl}/api/quickbooks/disconnect`, {})
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(
              response.error?.message || "Failed to disconnect QuickBooks",
            );
          }
        }),
      );
  }

  private async openAuthWindow(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const browser = this.inAppBrowser.create(authUrl, "_blank", {
        location: "yes",
        hidden: "no",
        clearcache: "yes",
        clearsessioncache: "yes",
      });

      browser.on("loadstart").subscribe((event) => {
        if (event.url.includes("/quickbooks/callback")) {
          browser.close();

          // Extract authorization code from URL
          const urlParams = new URLSearchParams(event.url.split("?")[1]);
          const code = urlParams.get("code");

          if (code) {
            resolve(code);
          } else {
            reject(new Error("Authorization failed"));
          }
        }
      });

      browser.on("exit").subscribe(() => {
        reject(new Error("User cancelled authorization"));
      });
    });
  }
}
```

#### **Day 32-33: W-9 Form Implementation**

- **Digital W-9 Form**: Complete tax form with validation matching API format
- **Form Persistence**: Save draft forms locally
- **PDF Generation**: Generate and download W-9 PDFs
- **Submission Status**: Track form submission progress

#### **Day 34-35: Integration Status & Management**

- **Status Dashboard**: QuickBooks connection overview
- **Sync Status**: Contractor information synchronization
- **Error Handling**: Handle QuickBooks API errors gracefully
- **Disconnect Flow**: Remove QuickBooks integration

### **Phase 6: Profile Management & Settings (Week 6)**

#### **Day 36-37: Profile Management**

- **Profile View**: Display contractor information
- **Edit Profile**: Update personal information and skills
- \*\*
