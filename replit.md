# FaceSecure - AI-Powered Face Recognition System

## Overview

FaceSecure is a comprehensive face recognition application built for secure user authentication and management. The system combines modern web technologies with AI-powered face detection to provide real-time user registration, authentication, and profile management. The application features a React-based frontend with a clean, mobile-responsive interface and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing with pages for splash, onboarding, dashboard, camera, and profiles
- **UI Components**: Shadcn/UI component library with Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack React Query for server state management and caching
- **Face Detection**: Face-API.js library for real-time face detection, landmark analysis, and descriptor generation
- **Camera Integration**: Custom hooks for camera access and video stream management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Type System**: TypeScript throughout for compile-time safety
- **Storage Layer**: Abstracted storage interface with in-memory implementation (designed for easy database integration)
- **API Design**: RESTful endpoints for user management (/api/users) and recognition logging
- **Development Setup**: Vite development server with hot module replacement and error overlay

### Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM for type-safe database operations
- **Schema Design**: 
  - Users table with face descriptors (128D embeddings), profile images, roles, and activity tracking
  - Recognition logs table for audit trails with confidence scores and timestamps
- **Face Data**: 128-dimensional face descriptor arrays stored as JSONB for efficient similarity matching
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage

### Authentication and Authorization Mechanisms
- **Face Recognition**: Primary authentication method using face descriptor matching with confidence thresholds
- **Session Management**: Express sessions with PostgreSQL storage for user state persistence
- **Security Features**: Blink detection for liveness verification and confidence scoring for match validation
- **Access Control**: Role-based user management with active/inactive status tracking

### Build and Development
- **Build System**: Vite for fast development and optimized production builds
- **Bundle Strategy**: ESBuild for server-side bundling with external package handling
- **Development Tools**: TSX for TypeScript execution and Drizzle Kit for database migrations
- **Code Quality**: Comprehensive TypeScript configuration with strict mode enabled

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for database connectivity
- **drizzle-orm** and **drizzle-kit**: Type-safe ORM and migration tools for database management
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