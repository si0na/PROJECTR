# Samiksha: A Trend Analysis Tool

## Overview

Samiksha is a modern web-based trend analysis tool designed for project management and tracking. It provides a digital dashboard for project managers to submit standardized weekly project status reports, track project health using RAG (Red, Amber, Green) status indicators, and leverage AI-powered analysis for risk identification and insights.

The application follows a full-stack architecture with a React frontend, Express.js backend, PostgreSQL database using Drizzle ORM, and integrates with AI/LLM services for automated project analysis.

## User Preferences

User: Samiksha (Portfolio Executive/Admin with full system access)
Preferred communication style: Simple, everyday language.
Role: Admin with executive portfolio oversight capabilities

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Development**: tsx for TypeScript execution in development

### Data Layer
- **Database**: PostgreSQL (configured for use with Neon)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Zod schemas shared between frontend and backend

## Key Components

### Authentication & Authorization
- Role-based access control with three user roles:
  - Project Manager: Can manage assigned projects and submit reports
  - Delivery Manager: Can view all projects and configure AI settings
  - Admin: Full system access
- Session-based authentication (simplified implementation)

### Project Management
- Project creation and management
- Project assignment to managers
- RAG status tracking (Red, Amber, Green)
- Customer and engagement type tracking

### Reporting System
- Weekly status report submission
- Technical review management
- Standardized forms with validation
- Historical report tracking

### AI Integration
- Configurable LLM providers (Google, OpenAI, DeepSeek)
- Automated project analysis and risk assessment
- Portfolio-level insights and trend analysis
- AI-generated status assessments

### Dashboard & Analytics
- Real-time project health overview
- Trend visualization with charts
- Statistics and metrics display
- AI-powered portfolio analysis header

## Data Flow

1. **User Authentication**: Users authenticate and receive role-based access
2. **Project Setup**: Delivery managers create projects and assign project managers
3. **Report Submission**: Project managers submit weekly status reports through structured forms
4. **AI Analysis**: Configured LLM analyzes submissions and generates insights
5. **Dashboard Updates**: Real-time updates to dashboard showing project health and trends
6. **Analytics**: Historical data aggregation for trend analysis and reporting

## External Dependencies

### UI & Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Chart.js integration for data visualization

### Data & State Management
- TanStack Query for efficient data fetching and caching
- React Hook Form for performant form handling
- Zod for runtime type validation

### AI/LLM Integration
- Support for multiple AI providers (Google Gemini, OpenAI GPT, DeepSeek)
- Configurable API keys and model selection
- Automated analysis pipeline

### Database & ORM
- Drizzle ORM for type-safe database operations
- PostgreSQL with Neon serverless driver
- Automated migration management

## Deployment Strategy

- **Development**: Vite dev server with hot module replacement
- **Production Build**: Vite bundling for frontend, esbuild for backend
- **Target Platform**: Designed for cloud deployment (5-day timeline requirement)
- **Database**: PostgreSQL via environment variable configuration
- **Static Assets**: Served through Express with Vite integration in development

### Build Process
1. Frontend assets built with Vite to `dist/public`
2. Backend TypeScript compiled with esbuild to `dist/index.js`
3. Single deployment artifact with both frontend and backend
4. Environment-based configuration for database and AI services

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- AI provider API keys for LLM integration
- Node.js environment detection for development/production modes

## Recent Changes

### January 14, 2025 - Apple-Inspired Dashboard Redesign
- **AI Portfolio Assessment**: Redesigned with cleaner Apple-inspired card layout, condensed summary text, and key metrics display
- **Dashboard Search**: Added comprehensive project search functionality (by name, customer, project code)
- **Recent Activity Log**: Implemented activity tracking for reports, reviews, escalations, and status changes
- **Analytics Overview**: Added portfolio health pie chart and weekly trend bar chart using Recharts
- **Priority Projects Section**: Dashboard now shows only high-priority projects (Red status, escalations, high importance) instead of all projects
- **Apple-Style UI Elements**: Rounded corners (rounded-2xl), improved spacing, softer color palette, enhanced visual hierarchy
- **Responsive Layout**: Three-column grid with analytics and priority projects on left, activity and quick actions on right
- **Enhanced Visual Design**: Consistent icon styling, improved typography, better use of whitespace

## Recent Changes: Latest modifications with dates

### July 19, 2025 - External API Integration
- **Complete Migration**: Successfully migrated from local Express API to external API at `http://34.63.198.88/api/projects/`
- **Proxy Implementation**: Created Express proxy endpoint to handle CORS issues with external API
- **Frontend Updates**: Updated all React Query calls across 8+ components to use external API endpoint
- **Error Handling**: Added comprehensive error handling and fallbacks for external API failures
- **Data Verification**: External API successfully returning 13 projects with ~220ms response time
- **Removed Local Endpoints**: Eliminated all local project CRUD endpoints in favor of external data source

### January 14, 2025 - Excel Data Structure Integration
- **Schema Alignment**: Updated project and weekly status report schemas to match Excel WSR format exactly
- **Real Project Data**: Replaced test data with authentic projects from Excel file:
  - CALX Compass (Strategic, Red status, UI component library blockers)
  - New Era Cap Snowflake Data Team (Critical, Amber status, OLAP reports focus)
  - Seymour Whyte Connect (Strategic, Red status, API dependency issues)
  - Halo Trading Platform (Medium, Amber status, fixed income automation)
  - New Era Cap Integration Stream (Medium, Green status, Smaregi integration)
  - New Era Cap eCommerce Platform (Medium, Green status, SHOPIFY POS support)
- **Weekly Status Reports**: Added realistic WSR data with actual project updates, challenges, and plans
- **Enhanced Project Schema**: Added account field, billing model, tower, FTE, revenue tracking
- **WSR Schema Updates**: Added week numbers, health tracking (previous/current), tower assignment, billing model
- **Comprehensive Filtering**: Projects page supports filtering by all new data dimensions
- **Apple-Inspired Design**: Maintained clean rounded corners, professional styling, and intuitive layout

### Previous - Apple-Inspired Dashboard Redesign
- **AI Portfolio Assessment**: Redesigned with cleaner Apple-inspired card layout, condensed summary text, and key metrics display
- **Dashboard Search**: Added comprehensive project search functionality (by name, customer, project code)  
- **Recent Activity Log**: Implemented activity tracking for reports, reviews, escalations, and status changes
- **Analytics Overview**: Added portfolio health pie chart and weekly trend bar chart using Recharts
- **Priority Projects Section**: Dashboard now shows only high-priority projects (Red status, escalations, high importance) instead of all projects
- **Apple-Style UI Elements**: Rounded corners (rounded-2xl), improved spacing, softer color palette, enhanced visual hierarchy
- **Responsive Layout**: Three-column grid with analytics and priority projects on left, activity and quick actions on right
- **Enhanced Visual Design**: Consistent icon styling, improved typography, better use of whitespace