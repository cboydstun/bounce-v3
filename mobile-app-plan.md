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

## 🎯 Core Features & Improvements

### **Key Features**

- **JWT Authentication**: Secure login with 15-minute access tokens and 7-day refresh tokens
- **Real-time Updates**: WebSocket integration for live task notifications
- **Location-based Discovery**: Find nearby tasks with geolocation
- **Offline Mode**: Queue actions when offline, sync when connected
- **Photo Upload**: Compressed image uploads to Cloudinary
- **QuickBooks Integration**: OAuth flow and W-9 form submission
- **Push Notifications**: FCM/APNs for task alerts
- **Biometric Security**: TouchID/FaceID support
- **Background Location**: Track contractor location for nearby tasks
- **Multi-language**: English/Spanish support

### **Technical Stack**

```yaml
Framework: Ionic 7.2.0
UI Library: React 18.2.0
Language: TypeScript 5.4
State Management: Zustand + React Query
Routing: React Router v6
Native: Capacitor 5.7
Styling: Tailwind CSS + Ionic Components
Maps: Google Maps + React
Real-time: Socket.io-client 4.7
HTTP: Axios + React Query
Storage: Ionic Storage + Capacitor Preferences
Camera: Capacitor Camera Plugin
Push: Firebase Cloud Messaging
Analytics: Firebase Analytics
Monitoring: Sentry
Testing: Vitest + React Testing Library + Cypress
Build: Vite
```

## 🏗️ Project Architecture

### **Folder Structure**

```
bounce-contractor-app/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── VerificationCode.tsx
│   │   │   ├── BiometricPrompt.tsx
│   │   │   └── PasswordReset.tsx
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── PullToRefresh.tsx
│   │   │   ├── InfiniteScroll.tsx
│   │   │   ├── OfflineBanner.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskMap.tsx
│   │   │   ├── TaskFilters.tsx
│   │   │   ├── TaskStatusBadge.tsx
│   │   │   ├── TaskTimer.tsx
│   │   │   └── TaskCompletionForm.tsx
│   │   ├── forms/
│   │   │   ├── PhotoUpload.tsx
│   │   │   ├── SignaturePad.tsx
│   │   │   ├── SkillSelector.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   └── W9Form.tsx
│   │   └── notifications/
│   │       ├── NotificationCard.tsx
│   │       ├── NotificationList.tsx
│   │       └── NotificationBadge.tsx
│   ├── hooks/
│   │   ├── auth/
│   │   │   ├── useAuth.ts
│   │   │   ├── useLogin.ts
│   │   │   ├── useRegister.ts
│   │   │   ├── useTokenRefresh.ts
│   │   │   └── useBiometric.ts
│   │   ├── api/
│   │   │   ├── useApi.ts
│   │   │   ├── useApiQuery.ts
│   │   │   ├── useApiMutation.ts
│   │   │   └── useOfflineQueue.ts
│   │   ├── tasks/
│   │   │   ├── useTasks.ts
│   │   │   ├── useTaskClaim.ts
│   │   │   ├── useTaskStatus.ts
│   │   │   ├── useTaskCompletion.ts
│   │   │   └── useNearbyTasks.ts
│   │   ├── location/
│   │   │   ├── useGeolocation.ts
│   │   │   ├── useBackgroundLocation.ts
│   │   │   └── useDistanceCalculation.ts
│   │   ├── realtime/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useTaskEvents.ts
│   │   │   └── useNotifications.ts
│   │   └── common/
│   │       ├── useNetwork.ts
│   │       ├── useStorage.ts
│   │       ├── usePlatform.ts
│   │       ├── useCamera.ts
│   │       └── useDebounce.ts
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Splash.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── VerifyEmail.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── tasks/
│   │   │   ├── AvailableTasks.tsx
│   │   │   ├── MyTasks.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── TaskProgress.tsx
│   │   │   ├── TaskCompletion.tsx
│   │   │   └── TaskHistory.tsx
│   │   ├── profile/
│   │   │   ├── Profile.tsx
│   │   │   ├── EditProfile.tsx
│   │   │   ├── Skills.tsx
│   │   │   ├── Earnings.tsx
│   │   │   └── Settings.tsx
│   │   ├── quickbooks/
│   │   │   ├── QuickBooksConnect.tsx
│   │   │   ├── W9FormPage.tsx
│   │   │   ├── TaxDocuments.tsx
│   │   │   └── PaymentHistory.tsx
│   │   └── notifications/
│   │       ├── NotificationCenter.tsx
│   │       └── NotificationSettings.tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── apiConfig.ts
│   │   │   ├── apiTypes.ts
│   │   │   └── endpoints.ts
│   │   ├── auth/
│   │   │   ├── authService.ts
│   │   │   ├── tokenService.ts
│   │   │   ├── biometricService.ts
│   │   │   └── sessionService.ts
│   │   ├── storage/
│   │   │   ├── storageService.ts
│   │   │   ├── secureStorage.ts
│   │   │   └── cacheManager.ts
│   │   ├── location/
│   │   │   ├── locationService.ts
│   │   │   ├── geofencingService.ts
│   │   │   └── backgroundLocation.ts
│   │   ├── notifications/
│   │   │   ├── pushNotifications.ts
│   │   │   ├── localNotifications.ts
│   │   │   └── notificationHandler.ts
│   │   ├── realtime/
│   │   │   ├── websocketService.ts
│   │   │   ├── connectionManager.ts
│   │   │   └── eventDispatcher.ts
│   │   └── offline/
│   │       ├── offlineService.ts
│   │       ├── syncQueue.ts
│   │       └── conflictResolver.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── taskStore.ts
│   │   ├── profileStore.ts
│   │   ├── notificationStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── task.types.ts
│   │   ├── quickbooks.types.ts
│   │   └── notification.types.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── helpers.ts
│   │   └── errorCodes.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── api.config.ts
│   │   └── firebase.config.ts
│   ├── theme/
│   │   ├── variables.css
│   │   ├── tailwind.css
│   │   └── animations.css
│   ├── App.tsx
│   ├── main.tsx
│   └── setupTests.ts
├── public/
├── android/
├── ios/
├── capacitor.config.ts
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## 📱 UI/UX Design System

### **Component Library**

```tsx
// Consistent design tokens
const theme = {
  colors: {
    primary: "#2563eb",
    secondary: "#f97316",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    dark: "#1e293b",
    light: "#f8fafc",
  },
  spacing: {
    xs: "0.5rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
  },
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    full: "9999px",
  },
};
```

### **Key Screen Flows**

1. **Authentication Flow**

   - Splash → Onboarding (first time) → Login/Register
   - Biometric setup after first login
   - Email verification with auto-redirect

2. **Task Discovery Flow**

   - Location permission → Available tasks (map/list view)
   - Real-time updates via WebSocket
   - Smart filtering and sorting

3. **Task Management Flow**

   - Claim → In Progress → Complete
   - Photo upload with compression
   - Offline queue for poor connectivity

4. **QuickBooks Integration Flow**
   - OAuth connection → W-9 submission → Status tracking
   - In-app browser for secure authentication

## 🚀 Implementation Status

### **✅ Phase 1: Foundation & Core Services (COMPLETED)**

#### **Project Setup & Infrastructure**

- ✅ **Ionic React Project**: Created with Capacitor for cross-platform deployment
- ✅ **TypeScript Configuration**: Full type safety throughout the application
- ✅ **Tailwind CSS Integration**: Custom design system with Ionic components
- ✅ **State Management**: Zustand store with persistence for authentication
- ✅ **API Client**: Axios-based client with automatic token refresh and error handling
- ✅ **Project Structure**: Organized according to plan with proper separation of concerns

#### **Authentication System**

- ✅ **Complete Auth Flow**: Login, register, logout, and protected routes
- ✅ **JWT Token Management**: Automatic refresh with 15-minute access tokens
- ✅ **Email Verification**: Browser-friendly GET endpoint with HTML responses
- ✅ **Secure Storage**: Persistent authentication state with Zustand
- ✅ **CORS Configuration**: Proper API server setup for mobile app communication
- ✅ **Error Handling**: Comprehensive error management and user feedback
- 🔄 **Biometric Support**: Framework ready for TouchID/FaceID integration

#### **Core Pages & Navigation**

- ✅ **Splash Screen**: App initialization and auth status checking
- ✅ **Authentication Pages**: Login and registration with form validation
- ✅ **Main App Tabs**: Available Tasks, My Tasks, Notifications, Profile
- ✅ **Protected Routes**: Automatic redirection for unauthenticated users
- ✅ **Responsive Design**: Mobile-first design with Tailwind CSS

#### **Type System & Architecture**

- ✅ **Comprehensive Types**: Complete TypeScript definitions for:
  - API responses and requests
  - Authentication and user management
  - Task management and workflow
  - Notification system
  - All component props and state
- ✅ **Service Layer**: Structured services for API, auth, storage, and more
- ✅ **Configuration Management**: Centralized app configuration with environment variables

#### **Development Environment**

- ✅ **Hot Module Replacement**: Live development with Vite
- ✅ **Environment Configuration**: Development environment variables setup
- ✅ **Build System**: Production-ready build configuration
- ✅ **Testing Framework**: Vitest and Cypress setup for unit and e2e testing

### **✅ Phase 2: Core Features (COMPLETED)**

#### **Task Discovery & Management**

- ✅ **Task API Integration**: Successfully connected to mobile API server endpoints
- ✅ **Location Services**: Geolocation integration with Capacitor
- ✅ **Task Filtering**: Skills-based and location-based filtering implemented
- ✅ **API Parameter Mapping**: Fixed status value case sensitivity (lowercase TypeScript → capitalized API)
- ✅ **Error Handling**: Comprehensive error management for API calls
- ✅ **React Query Integration**: Proper caching, retry logic, and data synchronization

#### **Enhanced UI Components**

- ✅ **Task Cards**: Interactive task display with status badges, compensation, and action buttons
- ✅ **Task Lists**: Infinite scroll with pull-to-refresh functionality
- ✅ **Loading States**: Professional loading indicators and skeleton screens
- ✅ **Empty States**: User-friendly empty state messages with contextual icons
- ✅ **Status Management**: Task progress tracking with proper status transitions

#### **Task Management Hooks**

- ✅ **useTasks()**: Fetch available tasks with location-based filtering
- ✅ **useInfiniteTasks()**: Infinite scroll for task lists
- ✅ **useMyTasks()**: Fetch contractor's assigned tasks with status filtering
- ✅ **useTaskById()**: Get individual task details
- ✅ **useNearbyTasks()**: Location-based task discovery
- ✅ **useTaskStats()**: Task statistics and metrics

#### **Task Action System**

- ✅ **useClaimTask()**: Claim available tasks
- ✅ **useUpdateTaskStatus()**: Update task progress
- ✅ **useCompleteTask()**: Complete tasks with photo uploads
- ✅ **useCancelTask()**: Cancel tasks
- ✅ **useUploadTaskPhoto()**: Upload task documentation photos
- ✅ **useReportTaskIssue()**: Report task-related issues

#### **Authentication Fixes**

- ✅ **Login Flow**: Fixed API response format mismatch
- ✅ **Token Management**: Proper JWT token handling and refresh
- ✅ **State Management**: Corrected authentication state transitions
- ✅ **Error Handling**: Comprehensive login error debugging and resolution

### **📅 Phase 3: Advanced Features (PLANNED)**

#### **Real-time & Notifications**

- 📅 **WebSocket Integration**: Live task updates and notifications
- 📅 **Push Notifications**: Firebase Cloud Messaging setup
- 📅 **Local Notifications**: Task reminders and alerts

#### **QuickBooks Integration**

- 📅 **OAuth Flow**: Secure QuickBooks connection
- 📅 **W-9 Form Submission**: Digital tax form handling
- 📅 **Payment Tracking**: Earnings and payment history

#### **Offline Support**

- 📅 **Background Sync**: Queue actions when offline
- 📅 **Data Caching**: Critical data persistence
- 📅 **Conflict Resolution**: Handle offline/online data conflicts

### **🎯 Phase 4: Production Ready (PLANNED)**

#### **Performance & Security**

- 📅 **Biometric Authentication**: TouchID/FaceID implementation
- 📅 **Background Location**: Track contractor location for nearby tasks
- 📅 **Performance Optimization**: Bundle size and runtime optimization
- 📅 **Security Hardening**: Additional security measures

#### **Deployment & Distribution**

- 📅 **App Store Preparation**: iOS App Store submission
- 📅 **Google Play Store**: Android app distribution
- 📅 **CI/CD Pipeline**: Automated build and deployment
- 📅 **Analytics Integration**: User behavior tracking

## 🔧 Development Phases

### **Phase 1: Foundation & Core Services (COMPLETED)**

#### **Day 1-2: Project Setup**

```bash
# Create Ionic React app
npm create ionic@latest bounce-contractor -- --type=react --capacitor

# Install core dependencies
cd bounce-contractor
npm install zustand react-query axios socket.io-client
npm install react-router-dom react-hook-form
npm install @capacitor/camera @capacitor/geolocation @capacitor/network
npm install @capacitor/push-notifications @capacitor/preferences
npm install @ionic/storage firebase date-fns
npm install -D @types/react @types/node tailwindcss
npm install -D vitest @testing-library/react cypress
```
