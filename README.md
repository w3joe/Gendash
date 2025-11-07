# Gendash

Gendash is an AI-powered platform that automatically generates interactive dashboards from any API by analyzing data and creating intelligent visualizations in seconds.

## Problem

Creating dashboards from API data typically requires:
- Manual data analysis and interpretation
- Coding knowledge to build visualizations
- Time-consuming setup and configuration
- Technical expertise in data visualization tools

Gendash solves this by bridging the gap between raw API data and visual analytics, enabling users to generate dashboards instantly without any coding knowledge.

## Solution

Gendash uses AI to automatically:
- Analyze API endpoints and their data structures
- Determine appropriate visualization types based on data characteristics
- Generate interactive, component-based dashboards
- Create shareable and embeddable dashboard URLs

Simply provide an API endpoint, and Gendash handles the rest.

## Key Features

- **Automatic API Analysis**: Fetches and analyzes data from any REST or GraphQL API
- **AI-Powered Visualization**: Uses Google Gemini to intelligently select chart types and layouts
- **Interactive Dashboards**: Generates responsive dashboards with multiple visualization components
- **Dashboard Management**: Create, save, and manage multiple dashboards
- **Shareable URLs**: Generate unique URLs for each dashboard
- **Embedding Support**: Embed dashboards in external websites via iframe
- **Real-time Updates**: Refresh data from source APIs on demand

## Tech Stack

### Frontend
- **Framework**: Next.js 16+ (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Data Visualization**: D3.js
- **Deployment**: Google Cloud Run

### Backend
- **Framework**: Flask (Python)
- **AI Framework**: LangChain
- **LLM**: Google Gemini API
- **Containerization**: Docker
- **Deployment**: Google Cloud Run

### Database & Storage
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

### DevOps & Infrastructure
- **Container Registry**: Google Artifact Registry
- **CI/CD**: GitHub Actions / Cloud Build
- **Monitoring**: Google Cloud Monitoring

## Architecture

```
┌─────────────────────────────────────────┐
│      Next.js Frontend (Cloud Run)        │
│  - Prompt Interface                      │
│  - Dashboard View                        │
│  - Component Renderer                    │
└─────────────────────────────────────────┘
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────┐
│   Flask API + LangChain (Cloud Run)      │
│  - API Analysis                          │
│  - Data Processing                       │
│  - LLM Integration                       │
└─────────────────────────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Firebase   │  │   Google    │  │   User APIs │
│  Firestore  │  │   Gemini    │  │  (External) │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Component Flow

1. **Dashboard Generation**: User Input → Frontend → Flask API → LangChain → Google Gemini → Component Specification → Firebase → Dashboard Rendering
2. **Dashboard Retrieval**: URL Access → Frontend → Firebase Query → Dashboard Rendering
3. **Data Refresh**: Refresh Request → Flask API → External API → Data Processing → Component Update
