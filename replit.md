# FaceSecure - AI-Powered Face Recognition System

## Overview

FaceSecure is a comprehensive face recognition application built for secure user authentication and management. The system combines modern web technologies with AI-powered face detection to provide real-time user registration, authentication, and profile management. The application features a React-based frontend with a fully mobile-responsive interface and an Express.js backend with MongoDB database integration.

## Recent Changes (August 2025)

✓ **Migration to Standard Replit Environment**: Successfully migrated from Replit Agent to standard Replit environment with proper fallback mechanisms
✓ **Auto-Capture Functionality**: Implemented automatic face capture without manual button clicks for seamless user experience
✓ **Enhanced Alert System**: Added beautiful popup alerts for registration errors, face detection status, and success messages
✓ **Streamlined Registration Flow**: Registration now captures face first, then asks for name on separate screen only if face isn't already registered
✓ **Face Pre-Check System**: Automatically verifies if face is already registered before allowing name entry
✓ **Clean UI Design**: Removed cluttered interface elements by separating face capture and name input into distinct steps
✓ **Mobile Optimization Completed**: Full mobile compatibility with touch-optimized controls, responsive design, and safe area handling
✓ **Duplicate Face Prevention**: Implemented face similarity checking to prevent same person registering multiple times with different names
✓ **Profile Editing**: Added working edit functionality for user profiles with dialog-based interface
✓ **Role Selection Removed**: Completely eliminated role-based functionality for simplified user experience
✓ **Text Overlapping Fixed**: Resolved mobile UI text overlapping issues with proper responsive typography
✓ **Welcome Page Implementation**: Created dedicated welcome page for successful authentication instead of popup alerts
✓ **Enhanced Dashboard UI**: Completely redesigned dashboard with modern cards, gradients, and improved visual hierarchy
✓ **MongoDB Integration**: Connected to user-provided MongoDB URI for persistent data storage in 'facesecure' database

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing with pages for splash, onboarding, dashboard, camera, and profiles
- **UI Components**: Shadcn/UI component library with Radix UI primitives for consistent, accessible design
- **Mobile Optimization**: Fully responsive design with touch-optimized controls, safe area handling, and proper mobile scaling
- **Styling**: Tailwind CSS with custom CSS variables for theming and mobile-first responsive design
- **State Management**: TanStack React Query for server state management and caching
- **Face Detection**: Face-API.js library for real-time face detection, landmark analysis, and descriptor generation
- **Camera Integration**: Custom hooks for camera access and video stream management with mobile-friendly interface

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Type System**: TypeScript throughout for compile-time safety
- **Storage Layer**: Abstracted storage interface with MongoDB implementation for persistent data storage
- **API Design**: RESTful endpoints for user management (/api/users) and recognition logging
- **Development Setup**: Vite development server with hot module replacement and error overlay

### Data Storage Solutions
- **Database**: MongoDB with native driver for flexible document-based storage
- **Schema Design**: 
  - Users collection with face descriptors (128D embeddings), profile images, roles, and activity tracking
  - Recognition logs collection for audit trails with confidence scores and timestamps
- **Face Data**: 128-dimensional face descriptor arrays stored as embedded arrays for efficient similarity matching
- **Connection**: MongoDB Atlas cloud database with connection string authentication

### Authentication and Authorization Mechanisms
- **Face Recognition**: Primary authentication method using face descriptor matching with confidence thresholds (0.6 threshold)
- **Duplicate Prevention**: Face similarity checking prevents same person registering with different names
- **Session Management**: Express sessions with PostgreSQL storage for user state persistence
- **Security Features**: Blink detection for liveness verification and confidence scoring for match validation
- **Profile Management**: Active/inactive status tracking with working profile editing functionality

### Build and Development
- **Build System**: Vite for fast development and optimized production builds
- **Bundle Strategy**: ESBuild for server-side bundling with external package handling
- **Development Tools**: TSX for TypeScript execution and Drizzle Kit for database migrations
- **Code Quality**: Comprehensive TypeScript configuration with strict mode enabled

## External Dependencies

### Core Framework Dependencies
- **mongodb**: Official MongoDB driver for database connectivity and operations
- **express**: Web application framework for API server
- **@tanstack/react-query**: Server state management and caching solution

### Face Recognition and Computer Vision
- **@vladmandic/face-api**: Face detection, landmark recognition, and descriptor generation
- **canvas**: Server-side canvas implementation for image processing operations

### UI and Styling Libraries
- **@radix-ui/react-***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Utility for creating component variants with Tailwind
- **lucide-react**: Consistent icon library for modern interfaces

### Form and Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for form integration
- **zod**: Schema validation for runtime type checking

### Development and Build Tools
- **vite**: Fast build tool and development server
- **@vitejs/plugin-react**: React support for Vite
- **esbuild**: Fast JavaScript bundler for server builds
- **tsx**: TypeScript execution environment for development

### Session and Security
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **express-session**: Session middleware for user state management

### Utility Libraries
- **date-fns**: Modern date utility library for time formatting
- **clsx** and **tailwind-merge**: Class name utilities for conditional styling
- **nanoid**: Compact URL-safe unique ID generator