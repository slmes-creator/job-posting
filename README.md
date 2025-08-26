# VolunteerHub - High School Service Hours Platform

A comprehensive web application connecting high school volunteers with meaningful service opportunities to earn community service hours.

## Features

### For Volunteers
- Browse and filter volunteer opportunities
- Apply to positions with one click
- Track service hours automatically
- View application status and history
- Mobile-responsive dashboard

### For Organizations
- Post volunteer opportunities
- Manage applications and volunteers
- Track and verify completed hours
- Organization profile management
- Application review system

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Framework**: Material-UI v5
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd volunteer-platform
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up Firebase:
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration

4. Environment setup:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your Firebase configuration in `.env.local`:
\`\`\`
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Firebase Security Rules

### Firestore Rules
\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Jobs are readable by all authenticated users
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.organizationId == request.auth.uid);
    }
    
    // Applications
    match /applications/{applicationId} {
      allow read: if request.auth != null && 
        (resource.data.volunteerId == request.auth.uid || 
         resource.data.organizationId == request.auth.uid);
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.volunteerId;
      allow update: if request.auth != null && 
        resource.data.organizationId == request.auth.uid;
    }
  }
}
\`\`\`

### Storage Rules
\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
\`\`\`bash
npm i -g vercel
\`\`\`

2. Deploy:
\`\`\`bash
vercel
\`\`\`

3. Set environment variables in Vercel dashboard

### Deploy to Firebase Hosting

1. Install Firebase CLI:
\`\`\`bash
npm install -g firebase-tools
\`\`\`

2. Login and initialize:
\`\`\`bash
firebase login
firebase init hosting
\`\`\`

3. Build and deploy:
\`\`\`bash
npm run build
firebase deploy
\`\`\`

## Project Structure

\`\`\`
volunteer-platform/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── login/                   # Authentication pages
│   ├── register/
│   ├── volunteer/               # Volunteer-specific pages
│   │   ├── dashboard/
│   │   ├── jobs/
│   │   └── profile/
│   └── organization/            # Organization-specific pages
│       ├── dashboard/
│       ├── jobs/
│       └── profile/
├── components/                   # Reusable components
│   ├── Layout/                  # Layout components
│   ├── UI/                      # UI components
│   └── ProtectedRoute.tsx       # Route protection
├── contexts/                     # React contexts
│   └── AuthContext.tsx          # Authentication context
├── lib/                         # Utilities and configuration
│   ├── firebase.ts              # Firebase configuration
│   ├── types.ts                 # TypeScript types
│   └── theme.ts                 # Material-UI theme
└── public/                      # Static assets
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
