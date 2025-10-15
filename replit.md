# F1 Telemetry Analysis Platform

## Overview

This is a full-stack web application (CEBRIC) for analyzing Formula 1 telemetry data. The platform enables users to visualize lap times, compare driver performance, and examine detailed telemetry metrics (speed, throttle, brake) across different racing sessions. It integrates with FastF1 Python library to fetch real-time F1 data and presents it through an interactive dashboard built with React and Chart.js.

## Recent Changes (October 2025)

- Added tire degradation and energy management analysis types to Advanced Analysis lap section
- Enhanced brake analysis with detailed zone-by-zone breakdown (removed chart visualization, fixed data property mappings)
- Added comprehensive deployment and networking instructions to README
- Updated social media links: Telegram (https://t.me/CEBRICF1), Instagram (https://www.instagram.com/cebricf1/)
- Extended race averages with additional metrics: Fastest Lap, Top Speed, Average Speed, Session Duration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript using Vite as the build tool and development server
- Client-side routing implemented with Wouter for lightweight page navigation
- Component library based on Radix UI primitives with shadcn/ui styling system

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management and caching
- Custom query client configuration with infinite stale time and disabled refetching to optimize performance
- Local component state for UI interactions and filtering

**Styling Approach**
- Tailwind CSS with custom design tokens for F1-themed racing aesthetics
- Dark mode first design with cyan primary (#00D9FF) and red secondary (#FF1E42) colors
- CSS variables for theming stored in `index.css` with racing-inspired color palette
- Component variants managed through class-variance-authority

**Chart Visualization**
- Chart.js dynamically imported for lap time and telemetry visualization
- Custom canvas-based rendering for performance graphs
- Support for multi-driver comparison with distinct color coding

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript running on Node.js
- ESM module system throughout the codebase
- Custom middleware for request logging and JSON body parsing with raw body preservation

**API Design Pattern**
- RESTful endpoints under `/api` prefix
- Session data caching to minimize external API calls
- Zod schemas for request validation

**Python Integration**
- Child process spawning to execute Python scripts for FastF1 data fetching
- JSON-based communication between Node.js and Python processes
- FastF1 library used for accessing official F1 timing data

**Development Setup**
- Vite development server with HMR integrated into Express middleware
- Custom error overlay and development banner plugins for Replit environment
- SSR-style HTML serving in production with built assets

### Data Storage Solutions

**Database Schema (Drizzle ORM + PostgreSQL)**
- Three main tables: `f1_sessions`, `f1_laps`, and `f1_telemetry`
- Session data stored with JSON fields for flexible data structure
- Lap-level granularity with sector times and tire compound information
- Telemetry data stored as JSON arrays for speed, throttle, and brake metrics

**Caching Strategy**
- In-memory storage implementation (`MemStorage`) for development
- Session results cached by year/GP/session combination to avoid redundant FastF1 calls
- Database-backed caching for production with Drizzle ORM

**Schema Design Rationale**
- UUID primary keys using PostgreSQL's `gen_random_uuid()`
- Denormalized JSON storage for telemetry arrays to support flexible querying
- Foreign key relationships through varchar IDs (sessionId, lapId)

### Authentication and Authorization

No authentication system is currently implemented. The application is designed for public access or deployment in trusted environments.

### External Dependencies

**Third-Party Services**
- **FastF1 Python Library**: Primary data source for F1 timing and telemetry data
  - Requires internet connectivity to fetch session data
  - Uses local file caching (`fastf1_cache` directory) to improve performance
  - Supports F1 data from 2020-2024 seasons

**Database Provider**
- **Neon Database (@neondatabase/serverless)**: Serverless PostgreSQL provider
  - Configured via `DATABASE_URL` environment variable
  - Connection pooling handled by Neon's serverless driver

**UI Component Libraries**
- **Radix UI**: Accessible component primitives for dialogs, popovers, selects, etc.
- **shadcn/ui**: Pre-built component patterns with Tailwind styling
- **Chart.js**: Canvas-based charting library for data visualization
- **Lucide React**: Icon library for UI elements

**Development Tools**
- **Replit Plugins**: Cartographer and dev banner for enhanced Replit IDE integration
- **Drizzle Kit**: Database migration tool for schema management
- **ESBuild**: Production bundling for server-side code

**Runtime Requirements**
- Node.js with ESM support
- Python 3 with pip (for FastF1 and dependencies: pandas, numpy)
- PostgreSQL database (via Neon or compatible provider)