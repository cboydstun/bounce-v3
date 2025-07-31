# PartyPad - Contractor Mobile App

A cross-platform mobile application built with Ionic React for bounce house delivery contractors. PartyPad enables contractors to discover, claim, and manage party setup tasks with real-time notifications and QuickBooks integration.

## 🚀 Features

### Core Functionality

- **Contractor Authentication**: Registration, login, email verification, password reset
- **Task Discovery**: Location-based task browsing with skills filtering
- **Task Management**: Claim, update status, complete tasks with photo uploads
- **Real-time Notifications**: Live updates for new tasks, assignments, and status changes
- **QuickBooks Integration**: Connect accounting, submit W-9 forms, download PDFs
- **Profile Management**: Update skills, contact information, and preferences
- **Offline Support**: Cache critical data for offline functionality

### Technical Features

- **JWT Authentication**: Secure login with 15-minute access tokens and 7-day refresh tokens
- **Real-time Updates**: WebSocket integration for live task notifications
- **Location-based Discovery**: Find nearby tasks with geolocation
- **Offline Mode**: Queue actions when offline, sync when connected
- **Photo Upload**: Compressed image uploads to Cloudinary
- **Push Notifications**: FCM/APNs for task alerts
- **Biometric Security**: TouchID/FaceID support
- **Background Location**: Track contractor location for nearby tasks

## 🛠️ Tech Stack

- **Framework**: Ionic 7.2.0
- **UI Library**: React 18.2.0
- **Language**: TypeScript 5.4
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Native**: Capacitor 5.7
- **Styling**: Tailwind CSS + Ionic Components
- **HTTP Client**: Axios + React Query
- **Storage**: Ionic Storage + Capacitor Preferences
- **Real-time**: Socket.io-client 4.7
- **Testing**: Vitest + React Testing Library + Cypress
- **Build Tool**: Vite

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── common/         # Reusable UI components
│   ├── layout/         # Layout components
│   ├── tasks/          # Task-related components
│   ├── forms/          # Form components
│   └── notifications/  # Notification components
├── hooks/              # Custom React hooks
│   ├── auth/          # Authentication hooks
│   ├── api/           # API hooks
│   ├── tasks/         # Task management hooks
│   ├── location/      # Location services hooks
│   ├── realtime/      # Real-time communication hooks
│   └── common/        # Common utility hooks
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── tasks/         # Task management pages
│   ├── profile/       # Profile pages
│   ├── quickbooks/    # QuickBooks integration pages
│   └── notifications/ # Notification pages
├── services/           # Service layer
│   ├── api/           # API client and configuration
│   ├── auth/          # Authentication services
│   ├── storage/       # Storage services
│   ├── location/      # Location services
│   ├── notifications/ # Notification services
│   ├── realtime/      # Real-time services
│   └── offline/       # Offline support services
├── store/              # State management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── config/             # Configuration files
└── theme/              # Styling and themes
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Ionic CLI (`npm install -g @ionic/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd partypad
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

### Mobile Development

#### Android

```bash
# Add Android platform
ionic capacitor add android

# Build and sync
npm run build
ionic capacitor sync android

# Open in Android Studio
ionic capacitor open android
```

#### iOS

```bash
# Add iOS platform
ionic capacitor add ios

# Build and sync
npm run build
ionic capacitor sync ios

# Open in Xcode
ionic capacitor open ios
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WEBSOCKET_URL=ws://localhost:3001

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# QuickBooks Configuration
VITE_QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
VITE_QUICKBOOKS_REDIRECT_URI=your_redirect_uri

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
```

### App Configuration

The app configuration is located in `src/config/app.config.ts`. You can modify:

- API endpoints and timeouts
- Authentication settings
- Feature flags
- UI/UX settings
- Storage keys
- Error codes

## 📱 Features Implementation Status

### ✅ Completed

- [x] Project setup and configuration
- [x] Authentication system (login/register/logout)
- [x] Protected routes
- [x] State management with Zustand
- [x] API client with automatic token refresh
- [x] Basic UI components and pages
- [x] Tailwind CSS integration
- [x] TypeScript type definitions
- [x] Responsive design

### 🚧 In Progress / Planned

- [ ] Task discovery and management
- [x] Real-time WebSocket integration
- [ ] Location services and geolocation
- [ ] Photo upload and camera integration
- [x] Push notifications with audio alerts
- [ ] Biometric authentication
- [ ] QuickBooks integration
- [ ] Offline support and sync
- [ ] Background location tracking
- [ ] Maps integration
- [ ] Testing suite completion

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run linting
npm run lint
```

## 📦 Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

## 🔄 API Integration

The app is designed to work with the Bounce Mobile API Server. Make sure the API server is running on `http://localhost:3001` or update the `VITE_API_BASE_URL` environment variable.

### API Endpoints Used

- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `GET /auth/verify` - Token verification
- `GET /contractors/profile` - Get contractor profile
- `PATCH /contractors/profile` - Update contractor profile

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🗺️ Roadmap

### Phase 1: Foundation (Completed)

- ✅ Project setup and basic authentication
- ✅ Core UI components and navigation
- ✅ State management and API integration

### Phase 2: Core Features (Next)

- 🔄 Task discovery and management
- 🔄 Real-time notifications
- 🔄 Location services

### Phase 3: Advanced Features

- 📅 Photo upload and camera integration
- 📅 QuickBooks integration
- 📅 Offline support

### Phase 4: Production Ready

- 📅 Performance optimization
- 📅 Security hardening
- 📅 App store deployment
