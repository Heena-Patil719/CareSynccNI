# CareSync - Healthcare Management & Medical Code Mapping System

## Project Overview

**CareSync** is a comprehensive full-stack healthcare management application that bridges traditional Indian medicine coding systems (NAMASTE) with the WHO's international disease classification standard (ICD-11). It's designed to streamline patient management, facilitate medical code mapping, and assist healthcare professionals with AI-powered diagnosis support.

The system serves as a bridge between traditional and modern medical systems, allowing healthcare providers to efficiently document patient diagnoses in both traditional medicine formats (Ayurveda, Siddha, and Unani) and international standards.

---

## What CareSync Does

### Core Features

#### 1. **Patient Management System**
- Create, view, and manage detailed patient records
- Track patient demographics (name, DOB, gender, contact information)
- Record guardian/emergency contact details
- Maintain patient admission dates and medical histories
- Store health updates including vital signs (blood pressure, heart rate, temperature)
- View patient-specific health charts and trends
- Export patient data in FHIR (Fast Healthcare Interoperability Resources) format

#### 2. **Medical Code Mapping**
- Map NAMASTE codes (traditional medicine diagnoses) to ICD-11 codes (international standards)
- Manage mappings across three traditional medicine systems:
  - **Ayurveda**: Traditional Indian herbal medicine system
  - **Siddha**: South Indian traditional medicine system
  - **Unani**: Greco-Islamic traditional medicine system
- Support for bulk upload of code mappings via CSV
- Search and filter capabilities for quick code lookup
- Confidence scoring for mapping accuracy
- Verification status tracking (verified/pending mappings)
- Create, edit, and delete code mappings
- Download mapping data for external use

#### 3. **AI-Powered Chatbot Assistant**
- Interactive medical assistant trained on NAMASTE and ICD-11 codes
- Natural language queries for:
  - NAMASTE code information and explanations
  - ICD-11 code mappings
  - Symptom-to-code suggestions
  - Traditional medicine category guidance (Ayurveda/Siddha/Unani)
- Static rule-based responses for common medical queries
- Dynamic context-aware suggestions based on keywords

#### 4. **Admin Dashboard & Management**
- Administrative control panel for system oversight
- NAMASTE code management interface
- Mapping approval workflow (verify pending mappings)
- User management with role-based access:
  - Admin (full access)
  - Editor (can create/modify data)
  - Viewer (read-only access)
- Database statistics and analytics
- Bulk operations support
- System configuration and settings

#### 5. **Authentication & Authorization**
- Secure user registration with OTP verification
- Email-based signup with Gmail SMTP integration
- Role-based access control (RBAC)
- Protected routes for authenticated users
- Admin-only access to sensitive features
- User profile management

---

## How CareSync Works

### Architecture Overview

CareSync is built as a **full-stack monolithic application** with clear separation between frontend and backend:

```
Frontend (Client) ↔ Backend (Server) ↔ Database (Supabase)
     ↓                   ↓                     ↓
  React 18           Express.js          PostgreSQL
  TypeScript          Node.js                 +
  Vite              Supabase SDK        Authentication
  TailwindCSS
  React Router 6
```

### Technology Stack

#### **Frontend - Client Layer**
- **React 18**: Modern UI library with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool and dev server
- **React Router v6**: SPA routing for navigation without page reloads
- **TailwindCSS 3**: Utility-first CSS framework for responsive UI
- **Radix UI**: Accessible component primitives (buttons, dialogs, forms, etc.)
- **React Hook Form**: Efficient form management with validation
- **React Query (TanStack Query)**: Server state management and caching
- **Recharts**: Data visualization and charting
- **Chart.js**: Advanced charting capabilities
- **Framer Motion**: Smooth animations and transitions
- **Axios**: HTTP client for API communication
- **PapaParse**: CSV parsing for bulk uploads

#### **Backend - Server Layer**
- **Express.js v5**: Lightweight web server framework
- **Node.js**: JavaScript runtime
- **TypeScript**: Type-safe backend code
- **Supabase**: Backend-as-a-Service (PostgreSQL + Auth)
- **Nodemailer**: Email sending (OTP verification)
- **BCrypt**: Password hashing and security
- **Zod**: Runtime type validation and schema definition
- **OpenAI API**: Integration for AI-powered features
- **Axios**: HTTP requests for external APIs

#### **Infrastructure & Tools**
- **PNPM**: Fast package manager (preferred over npm)
- **Supabase PostgreSQL**: Main application database
- **Netlify Functions**: Serverless backend deployment
- **Vite Dev Server**: Integrated development environment
- **Vitest**: Unit testing framework
- **Prettier**: Code formatting
- **TSC**: TypeScript compiler for type checking

#### **APIs & Integrations**
- **Supabase Auth API**: User authentication and management
- **OpenAI/Gemini API**: AI-powered chatbot responses
- **Gmail SMTP**: Email delivery for OTP verification
- **FHIR Standards**: HL7 FHIR format for patient data export

### Application Flow & Workflows

#### **User Authentication Flow**
```
1. User visits landing page (/login)
2. Enters email, password, first name, last name
3. Server sends 6-digit OTP to email
4. User enters OTP to verify email
5. Account created, user redirected to dashboard
6. Login credentials stored securely (bcrypt hashed)
```

#### **Patient Management Workflow**
```
1. User navigates to /patients page
2. Clicks "Add Patient" button
3. Fills patient form (demographics, contact info)
4. System stores patient in Supabase
5. User can:
   - View patient profile (/patients/:id)
   - Add diagnoses to patient
   - Update health metrics (BP, HR, temperature)
   - Export patient FHIR data
   - Track patient health trends with charts
```

#### **Medical Code Mapping Workflow**
```
1. User goes to /mapping page
2. Can perform operations:
   a) Manual code mapping:
      - Enter NAMASTE code (e.g., "AYR-001")
      - Enter corresponding ICD-11 code (e.g., "MG30")
      - Add symptoms and description
   
   b) Bulk upload via CSV:
      - Upload CSV with columns: namaste_code, icd11_code, symptoms
      - System parses and imports all records
   
   c) Search existing mappings:
      - Filter by traditional medicine category
      - Search by code or symptom
      - View mapping details
   
   d) Edit/Delete mappings:
      - Update mapping accuracy
      - Remove obsolete mappings
```

#### **AI Chatbot Interaction Flow**
```
1. Chatbot widget visible in bottom-right corner
2. User clicks to open chat interface
3. User types medical query (symptom, code, advice request)
4. Chatbot processing:
   - Checks against static response database first
   - If match found: return predefined response
   - If no match: send to OpenAI/Gemini API
   - Return contextual response about NAMASTE/ICD-11
```

#### **Admin Dashboard Workflow**
```
1. Admin user logs in
2. Accesses /admin dashboard
3. Can view:
   - NAMASTE code inventory
   - All active mappings with status
   - User management and roles
   - System analytics and statistics
4. Can perform:
   - Add/edit NAMASTE codes
   - Approve/verify pending mappings
   - Manage user accounts and roles
   - Upload bulk data
   - Export reports
```

### Data Models & Database Schema

#### **Patient Record**
```typescript
{
  id: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: "male" | "female" | "other"
  email?: string
  phone?: string
  guardianName?: string
  guardianPhone?: string
  address?: string
  admitDate?: string
  createdAt: string
  diagnoses: Diagnosis[]
  healthUpdates: HealthUpdate[]
}
```

#### **Diagnosis Record**
```typescript
{
  code: string                    // NAMASTE code
  icd11Code: string              // ICD-11 equivalent
  description: string
  recordedDate: string
  category: "Ayurveda" | "Siddha" | "Unani"
}
```

#### **Code Mapping Record**
```typescript
{
  id: string
  namaste_code: string           // Traditional medicine code
  namaste_name: string
  icd11_code: string             // WHO international standard
  icd11_name: string
  category: "Ayurveda" | "Siddha" | "Unani"
  symptoms: string
  description: string
  confidence: number             // 0-100 confidence score
  status: "verified" | "pending" // Verification status
  createdAt: string
}
```

#### **User Record**
```typescript
{
  id: string
  email: string
  firstName: string
  lastName: string
  password: string              // bcrypt hashed
  role: "admin" | "user"
  avatar?: string
  createdAt: string
  lastLogin?: string
}
```

### API Endpoints

#### **Authentication Routes** (`/api/auth`)
- `POST /sendOtp` - Send OTP to email
- `POST /verifyOtp` - Verify OTP and create account
- `POST /login` - User login with email/password

#### **Patient Routes** (`/api/patients`)
- `POST /` - Create new patient
- `GET /` - List all patients
- `GET /:patientId` - Get patient details
- `POST /:patientId/diagnoses` - Add diagnosis to patient
- `GET /:patientId/fhir` - Export patient data in FHIR format

#### **Code Mapping Routes** (`/api/codes`)
- `GET /search?q=term` - Search NAMASTE codes
- `GET /:code` - Get specific code details

#### **Chatbot Routes** (`/api/chat`, `/api/gemini`)
- `POST /` - Send message to chatbot
- AI-powered responses via OpenAI/Gemini

### Key Architectural Decisions

#### **Frontend (Client-Side)**
1. **SPA Architecture**: Uses React Router for client-side routing - no full page reloads
2. **Context API**: Manages global state (Auth, Theme, Internationalization)
3. **Protected Routes**: Sensitive pages require authentication check
4. **Component Composition**: Reusable UI components from Radix UI foundation
5. **Responsive Design**: TailwindCSS ensures mobile-friendly interface

#### **Backend (Server-Side)**
1. **Express Middleware**: CORS, JSON parsing, URL encoding
2. **Authentication**: OTP-based registration + bcrypt password hashing
3. **Supabase Integration**: Outsourced database and auth infrastructure
4. **Error Handling**: Zod schema validation for request bodies
5. **API Health Check**: `/api/ping` endpoint for monitoring

#### **Data Persistence**
1. **Supabase PostgreSQL**: Primary database for all records
2. **In-Memory Maps**: Mock patient database for demo/testing
3. **CSV Import**: Bulk data loading for code mappings

### Development Workflow

#### **Build Process**
```bash
# Development
npm run dev              # Starts Vite dev server + Express server

# Production
npm run build            # Builds both client and server
npm run build:client     # Build React SPA to dist/spa
npm run build:server     # Build Express server to dist/server
npm start                # Run production server
```

#### **Code Quality**
```bash
npm run typecheck        # TypeScript type checking
npm run format.fix       # Auto-format code with Prettier
npm test                 # Run unit tests with Vitest
```

### Security Features

1. **OTP Email Verification**: Users must verify email ownership during signup
2. **Password Hashing**: BCrypt hashes passwords before storage (never plain text)
3. **Role-Based Access Control**: Admin routes protected by role checks
4. **Protected Routes**: Client-side route guards prevent unauthorized access
5. **CORS**: Server configured to accept requests from authorized origins
6. **Zod Validation**: Server validates all incoming request data
7. **Environment Variables**: Sensitive credentials stored in `.env` (API keys, SMTP config)

---

## Project Structure

```
CareSynccNI/
├── client/                          # React frontend application
│   ├── App.tsx                      # Main app with routing setup
│   ├── global.css                   # TailwindCSS global styles
│   ├── pages/                       # Route components
│   │   ├── LandingPage.tsx         # Public landing page
│   │   ├── Login.tsx               # Login/signup page
│   │   ├── Index.tsx               # Dashboard
│   │   ├── Patients.tsx            # Patient listing & management
│   │   ├── PatientDetail.tsx       # Individual patient profile
│   │   ├── CodeMapping.tsx         # NAMASTE↔ICD-11 mapping management
│   │   ├── Admin.tsx               # Admin dashboard
│   │   ├── Profile.tsx             # User profile page
│   │   └── NotFound.tsx            # 404 page
│   ├── components/
│   │   ├── Chatbot.tsx             # AI chatbot widget
│   │   ├── Layout.tsx              # Main layout wrapper
│   │   ├── ProtectedRoute.tsx      # Route authentication guard
│   │   └── ui/                     # Pre-built UI component library
│   │       ├── button.tsx          # Button component
│   │       ├── input.tsx           # Input field
│   │       ├── dialog.tsx          # Modal dialog
│   │       ├── form.tsx            # Form utilities
│   │       ├── table.tsx           # Data table
│   │       ├── card.tsx            # Card layout
│   │       ├── toast.tsx           # Toast notifications
│   │       └── ... (40+ more UI components)
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Authentication state
│   │   ├── ThemeContext.tsx        # Dark/light theme
│   │   └── I18nContext.tsx         # Internationalization
│   ├── hooks/
│   │   ├── use-toast.ts            # Toast notification hook
│   │   └── use-mobile.tsx          # Mobile detection hook
│   ├── lib/
│   │   ├── supabaseClient.ts       # Supabase client initialization
│   │   ├── utils.ts                # Utility functions
│   │   └── utils.spec.ts           # Utility tests
│
├── server/                          # Express backend application
│   ├── index.ts                    # Main server setup & routes
│   ├── node-build.ts               # Server build configuration
│   ├── routes/
│   │   ├── auth.ts                 # Authentication endpoints
│   │   ├── patients.ts             # Patient CRUD operations
│   │   ├── codes.ts                # Medical code search
│   │   ├── chat.ts                 # Chatbot endpoint
│   │   ├── gemini.ts               # Gemini AI integration
│   │   └── demo.ts                 # Demo data endpoint
│   └── utils/
│       └── supabaseServerClient.ts # Server-side Supabase config
│
├── shared/                          # Shared types between client/server
│   └── api.ts                      # Type definitions for API contracts
│
├── netlify/                         # Serverless functions
│   └── functions/
│       └── api.ts                  # Netlify function handlers
│
├── public/                          # Static assets
│   └── robots.txt
│
├── Configuration Files:
│   ├── vite.config.ts              # Frontend Vite configuration
│   ├── vite.config.server.ts       # Backend Vite configuration
│   ├── tsconfig.json               # TypeScript config
│   ├── tailwind.config.ts          # TailwindCSS theme config
│   ├── postcss.config.js           # PostCSS configuration
│   ├── package.json                # Dependencies & scripts
│   ├── pnpm-lock.yaml              # Dependency lock file
│   ├── index.html                  # HTML entry point
│   ├── netlify.toml                # Netlify deployment config
│   └── Readme.md                   # Original documentation
```

---

## Key Features Summary

| Feature | Purpose | Technology |
|---------|---------|-----------|
| **Patient Management** | CRUD operations for patient records | React, Supabase, Express |
| **Code Mapping** | Link NAMASTE ↔ ICD-11 codes | React, CSV parsing, PostgreSQL |
| **AI Chatbot** | Medical code assistance | OpenAI/Gemini API, React |
| **FHIR Export** | Standards-compliant data export | Express, FHIR format |
| **Admin Dashboard** | System administration & oversight | React, role-based access |
| **Email Verification** | Secure signup with OTP | Nodemailer, Gmail SMTP |
| **Authentication** | Secure login/logout | Supabase Auth, bcrypt |
| **Health Tracking** | Patient vital signs & trends | Recharts, PostgreSQL |
| **Data Visualization** | Charts & analytics | Chart.js, Recharts |
| **Bulk Upload** | Import mappings from CSV | PapaParse, Express |

---

## Environment Variables Required

To run CareSync, you'll need:

```env
# Database & Auth
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
a

# Email Setup (Gmail SMTP)
SMTP_EMAIL=your_gmail@gmail.com
SMTP_APP_PASSWORD=your_gmail_app_password

# AI Integration
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Server Config
PING_MESSAGE=pong  # Custom health check message
NODE_ENV=development
```

---

## Getting Started

### Installation
```bash
# Install dependencies
pnpm install

# Development
pnpm run dev          # Starts dev server for client + backend

# Build for production
pnpm run build        # Builds both client and server

# Run production
pnpm start
```

### First Steps
1. Create Supabase account and set up PostgreSQL database
2. Configure environment variables in `.env` file
3. Set up Gmail SMTP for email verification (or alternative SMTP)
4. Run `pnpm install` to install all dependencies
5. Run `pnpm run dev` to start development server
6. Open browser to `http://localhost:5173`

---

## Summary

**CareSync** is a sophisticated healthcare management platform that digitizes the intersection between traditional Indian medicine (NAMASTE codes) and international medical standards (ICD-11). It provides:

- ✅ Complete patient lifecycle management
- ✅ Intelligent code mapping and search
- ✅ AI-powered medical assistant chatbot
- ✅ Role-based admin controls
- ✅ FHIR-compliant data export
- ✅ Secure authentication and authorization
- ✅ Modern, responsive web interface
- ✅ Scalable full-stack architecture

The system bridges cultural medicine practices with global healthcare standards, making it an innovative solution for Indian healthcare providers seeking international interoperability.
