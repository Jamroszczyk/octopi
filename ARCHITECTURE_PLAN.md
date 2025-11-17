# Architecture Plan: Beetroot/Krakel Application

## Overview

This document outlines the future architecture for the Beetroot/Krakel application, supporting both web and desktop (Windows/Mac) platforms with Firebase authentication and real-time database synchronization.

---

## Current State

- **Platform**: Web-only (React + Vite)
- **State Management**: Zustand
- **Deployment**: Static site on Render
- **Features**: Node graph editor, pinboard, timer, undo/redo

---

## Target Architecture

### Platforms
1. **Web Application** - Deployed on Render (static site)
2. **Desktop Application** - Windows & Mac (using Tauri)
3. **Future**: Mobile (React Native) - optional

### Backend Services
- **Firebase Authentication** - User login/registration
- **Firestore Database** - Real-time graph data storage
- **Serverless Functions** (Render) - For secure API calls (LLM APIs, etc.)

---

## Recommended Tech Stack

### Web
- React + Vite (current)
- Firebase Auth + Firestore
- Zustand (state management)
- Deploy: Render (static site)

### Desktop
- Tauri (Rust + WebView)
- Same React codebase
- Same Firebase SDK
- Build: Windows `.exe`, Mac `.dmg`

### Backend Services (Future)
- Render Serverless Functions (or Vercel/Netlify Functions)
- For: LLM API calls, other secure operations

---

## Project Structure (Monorepo)

```
beetroot/
├── packages/
│   ├── core/                    # Shared business logic
│   │   ├── store/              # Zustand stores (graphStore, etc.)
│   │   │   ├── graphStore.ts
│   │   │   └── authStore.ts    # Future: Firebase auth state
│   │   ├── utils/              # Shared utilities
│   │   │   ├── layoutEngine.ts
│   │   │   └── progressCalculation.ts
│   │   ├── types/              # Shared TypeScript types
│   │   │   └── index.ts
│   │   └── hooks/              # Shared React hooks
│   │       └── useFirebase.ts  # Future: Firebase hooks
│   │
│   ├── shared/                  # Shared UI code
│   │   ├── components/         # Components used by both platforms
│   │   │   ├── EditableNode.tsx
│   │   │   ├── GraphView.tsx
│   │   │   ├── Pinboard.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── Timer.tsx
│   │   ├── theme/              # Theme and styles
│   │   │   └── colors.ts
│   │   └── constants/          # Shared constants
│   │       └── index.ts
│   │
│   ├── web/                     # Web-specific code
│   │   ├── src/
│   │   │   ├── main.tsx        # Web entry point
│   │   │   ├── App.tsx         # Web-specific App wrapper
│   │   │   ├── services/       # Firebase web initialization
│   │   │   │   └── firebase.ts
│   │   │   └── index.css       # Web-specific styles
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── desktop/                 # Desktop app (Tauri)
│   │   ├── src/
│   │   │   ├── main.tsx        # Desktop entry point
│   │   │   ├── App.tsx         # Desktop-specific App wrapper
│   │   │   ├── services/       # Firebase desktop initialization
│   │   │   │   └── firebase.ts
│   │   │   └── tauri/          # Tauri-specific code
│   │   ├── src-tauri/          # Tauri Rust backend
│   │   │   ├── src/
│   │   │   │   └── main.rs
│   │   │   └── Cargo.toml
│   │   ├── tauri.conf.json     # Tauri configuration
│   │   └── package.json
│   │
│   └── firebase/                # Firebase configuration (shared)
│       ├── firestore.rules      # Security rules
│       ├── firestore.indexes.json
│       └── firebase-config.ts   # Platform-agnostic config
│
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── deploy-web.yml      # Deploy web to Render
│       └── build-desktop.yml   # Build desktop apps
│
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace configuration
└── ARCHITECTURE_PLAN.md        # This file
```

---

## Firebase Integration

### Authentication
- **Service**: Firebase Authentication
- **Provider**: Google Sign-In (primary)
- **Platforms**: Works identically on web and desktop
- **Implementation**: 
  - Web: Standard OAuth redirect flow
  - Desktop: Custom protocol handler for OAuth redirects

### Database
- **Service**: Firestore (Firebase Realtime Database alternative)
- **Use Case**: Store user's graph data (nodes, edges, pinned nodes, batch title)
- **Real-time Sync**: Automatic synchronization across devices
- **Offline Support**: Built-in offline persistence
- **Security**: Firestore security rules (server-side)

### Data Structure
```typescript
// Firestore Collections
users/
  {userId}/
    graphs/
      {graphId}/
        nodes: TaskNode[]
        edges: Edge[]
        pinnedNodeIds: string[]
        batchTitle: string
        createdAt: timestamp
        updatedAt: timestamp
```

---

## Deployment Strategy

### Web Application (Render)

#### Current Setup
- **Type**: Static Site
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/`
- **Service**: Render Static Site

#### Future Setup (with Firebase)
- **Type**: Static Site (still)
- **Build Command**: `cd packages/web && npm run build`
- **Publish Directory**: `packages/web/dist/`
- **Service**: Render Static Site
- **Environment Variables**: 
  - `VITE_FIREBASE_API_KEY` (public, safe to expose)
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

**Note**: Firebase config values are safe to expose in client-side code. Security is handled by Firestore security rules.

### Backend Services (Render - Future)

#### For LLM API Calls
- **Type**: Web Service
- **Runtime**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables** (server-side only):
  - `OPENAI_API_KEY` (secret, never exposed)
  - `FIREBASE_ADMIN_SDK` (for server-side Firebase operations)

**Structure**:
```
backend/
├── server.js              # Express/Fastify server
├── routes/
│   └── api/
│       └── chat.js        # LLM API proxy endpoint
└── package.json
```

### Desktop Application

#### Build Process
- **Framework**: Tauri
- **Build Command**: `cd packages/desktop && npm run tauri build`
- **Output**: 
  - Windows: `.exe` installer
  - Mac: `.dmg` installer
- **Distribution**: 
  - GitHub Releases
  - Direct download from website
  - Auto-update mechanism (Tauri updater)

---

## Migration Path

### Phase 1: Current State (✅ Done)
- Web-only application
- Static site on Render
- No backend

### Phase 2: Extract Shared Code (Future)
1. Create monorepo structure
2. Move shared code to `packages/core` and `packages/shared`
3. Refactor `src/` to `packages/web/src/`
4. Update imports to use shared packages
5. Test that web app still works

### Phase 3: Add Firebase (Future)
1. Set up Firebase project
2. Configure Firebase Auth (Google provider)
3. Set up Firestore database
4. Create Firestore security rules
5. Add Firebase SDK to web app
6. Implement authentication flow
7. Implement data sync (save/load graphs)
8. Test real-time synchronization

### Phase 4: Add Desktop Support (Future)
1. Set up Tauri in `packages/desktop`
2. Copy shared components
3. Configure Firebase for desktop (custom OAuth protocol)
4. Build desktop apps
5. Test on Windows and Mac
6. Set up auto-update mechanism

### Phase 5: Add Backend Services (Future - Optional)
1. Create backend service on Render
2. Set up serverless function for LLM API calls
3. Implement chat interface in UI
4. Connect frontend to backend API
5. Test secure API key handling

---

## Firebase Security Rules (Example)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Graphs belong to users
      match /graphs/{graphId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Code Sharing Strategy

### Shared Code
- **Business Logic**: `packages/core/store/` (Zustand stores)
- **Utilities**: `packages/core/utils/` (layout engine, calculations)
- **Components**: `packages/shared/components/` (React components)
- **Theme**: `packages/shared/theme/` (colors, styles)
- **Types**: `packages/core/types/` (TypeScript interfaces)

### Platform-Specific Code
- **Initialization**: Firebase config differs slightly
- **OAuth Redirects**: Web uses browser, desktop uses custom protocol
- **File System**: Desktop can access local files (Tauri APIs)
- **Auto-updates**: Desktop-specific update mechanism

---

## Environment Variables

### Web (Render Static Site)
```env
# Public (safe to expose in client)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Desktop (Build-time)
```env
# Same as web (public config)
TAURI_FIREBASE_API_KEY=...
TAURI_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### Backend (Render Web Service - Future)
```env
# Private (server-side only)
OPENAI_API_KEY=sk-...          # Never exposed to client
FIREBASE_ADMIN_SDK_KEY=...     # Server-side Firebase admin
NODE_ENV=production
```

---

## Why Tauri Over Electron?

| Feature | Tauri | Electron |
|---------|-------|----------|
| Bundle Size | ~3-5 MB | ~100+ MB |
| Memory Usage | Low (native WebView) | High (Chromium) |
| Performance | Excellent | Good |
| Security | Better (Rust backend) | Good |
| Maturity | Growing | Very mature |
| Learning Curve | Medium | Easy |

**Recommendation**: Use Tauri for better performance and smaller bundle size.

---

## Firebase vs Alternatives

### Why Firebase?
- ✅ Easy setup (no backend code needed)
- ✅ Real-time synchronization built-in
- ✅ Offline support out of the box
- ✅ Free tier is generous
- ✅ Works identically on web and desktop
- ✅ Google Auth integration is seamless

### Alternatives Considered
- **Supabase**: Similar to Firebase, open-source alternative
- **AWS Amplify**: More complex, better for enterprise
- **Custom Backend**: Too much work for this use case

---

## Render Deployment Details

### Static Site (Web App)
- **Service Type**: Static Site
- **Build Command**: `cd packages/web && npm install && npm run build`
- **Publish Directory**: `packages/web/dist`
- **Environment**: Production
- **Auto-Deploy**: Yes (on git push to main)

### Web Service (Backend - Future)
- **Service Type**: Web Service
- **Runtime**: Node.js 18+
- **Build Command**: `cd backend && npm install`
- **Start Command**: `node server.js`
- **Environment Variables**: Set in Render dashboard (secrets)
- **Health Check**: `/health` endpoint

---

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Run web app
cd packages/web
pnpm dev

# Run desktop app
cd packages/desktop
pnpm tauri dev

# Build desktop app
pnpm tauri build
```

### Testing
- **Web**: Test in browser (Chrome, Firefox, Safari)
- **Desktop**: Test on Windows and Mac
- **Firebase**: Use Firebase emulator for local testing

---

## Future Considerations

### Mobile Support (Optional)
- Use React Native
- Share `packages/core` and `packages/shared` code
- Platform-specific UI components for mobile

### Offline-First Strategy
- Firestore has built-in offline support
- Desktop can cache more aggressively
- Consider local-first architecture (e.g., Yjs for collaborative editing)

### Performance Optimization
- Code splitting for web
- Lazy loading of components
- Optimize bundle size for desktop

---

## Security Considerations

### ✅ Safe to Expose (Client-Side)
- Firebase config values (API keys, project IDs)
- These are public by design
- Security is enforced by Firestore rules

### ❌ Never Expose (Server-Side Only)
- OpenAI API keys
- Firebase Admin SDK keys
- Any secret tokens
- User passwords (handled by Firebase Auth)

### Best Practices
- Use Firestore security rules (server-side validation)
- Validate all user input
- Use Firebase Auth (don't implement custom auth)
- Keep secrets in Render environment variables (not in code)

---

## Timeline Estimate

- **Phase 2** (Extract shared code): 1-2 days
- **Phase 3** (Add Firebase): 2-3 days
- **Phase 4** (Add desktop): 3-5 days
- **Phase 5** (Backend services): 1-2 days (when needed)

**Total**: ~1-2 weeks for full implementation

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Tauri Documentation](https://tauri.app/)
- [Render Documentation](https://render.com/docs)
- [Monorepo with pnpm](https://pnpm.io/workspaces)

---

## Notes

- This is a living document - update as architecture evolves
- Start with Phase 2 when ready to refactor
- Firebase can be added incrementally (auth first, then database)
- Desktop support can be added later without breaking web app
- Backend services are optional and can be added when needed

