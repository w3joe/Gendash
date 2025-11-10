# Gendash Setup Guide

## Overview
Gendash is an AI-powered dashboard generator that transforms any API into beautiful, interactive dashboards using Google Gemini and LangChain.

## Architecture
- **Frontend**: Next.js 14+ (React/TypeScript) - Port 3000
- **Backend**: Flask (Python) + LangChain + Google Gemini - Port 8080
- **Database**: Firebase Firestore (optional for MVP)

---

## Backend Setup (gendash-engine)

### 1. Prerequisites
- Python 3.11+
- Google Gemini API Key

### 2. Install Dependencies
```bash
cd gendash-engine
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in `gendash-engine/` directory:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
FLASK_ENV=development
PORT=8080
```

### 4. Run the Backend
```bash
cd gendash-engine
python app.py
```

The backend will start on `http://localhost:8080`

### 5. Test the Backend
```bash
# Health check
curl http://localhost:8080/health

# Test dashboard generation
curl -X POST http://localhost:8080/api/generate-dashboard \
  -H "Content-Type: application/json" \
  -d '{"apiUrl": "https://jsonplaceholder.typicode.com/posts"}'
```

---

## Frontend Setup (gendash-frontend)

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Install Dependencies
```bash
cd gendash-frontend
npm install
```

### 3. Environment Variables
Create a `.env.local` file in `gendash-frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 4. Run the Frontend
```bash
cd gendash-frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

---

## Testing the Complete Flow

### 1. Start Both Services
```bash
# Terminal 1 - Backend
cd gendash-engine
python app.py

# Terminal 2 - Frontend
cd gendash-frontend
npm run dev
```

### 2. Test with Sample APIs

#### Example 1: Simple JSON API
```
https://jsonplaceholder.typicode.com/posts
```

#### Example 2: User Data
```
https://jsonplaceholder.typicode.com/users
```

#### Example 3: Financial Data
```
https://api.coindesk.com/v1/bpi/currentprice.json
```

### 3. Complete User Flow

1. **Open the app**: Navigate to `http://localhost:3000`
2. **Enter API URL**: Paste a public API endpoint (e.g., `https://jsonplaceholder.typicode.com/users`)
3. **Click "Generate Dashboard"**: Wait for the loading screen
4. **View Dashboard**: See the automatically generated charts and visualizations
5. **Refresh Data**: Click the refresh button to reload data from the API
6. **Create New**: Click "Create New Dashboard" to start over

---

## API Endpoints

### Backend Endpoints

#### POST /api/generate-dashboard
Generate a dashboard from an API endpoint.

**Request:**
```json
{
  "apiUrl": "https://api.example.com/data",
  "preferences": {
    "colorScheme": "default",
    "layout": "auto"
  }
}
```

**Response:**
```json
{
  "success": true,
  "dashboardId": "abc123",
  "spec": {
    "components": [
      {
        "id": "chart_1",
        "type": "line",
        "title": "Trend Over Time",
        "dataMapping": {
          "xAxis": "date",
          "yAxis": "value"
        }
      }
    ]
  }
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "gendash-engine",
  "version": "1.0.0"
}
```

---

## Supported Chart Types

1. **Line Chart** (`type: "line"`)
   - Time series data
   - Trend visualization

2. **Bar Chart** (`type: "bar"`)
   - Categorical comparisons
   - Vertical bars

3. **Horizontal Bar Chart** (`type: "horizontalBar"`)
   - Long category labels
   - Horizontal bars

4. **Pie Chart** (`type: "pie"`)
   - Proportions and percentages
   - Donut variant available

5. **Data Table** (`type: "table"`)
   - Detailed tabular data
   - Sortable and searchable

6. **Metric Card** (`type: "metric"`)
   - Key performance indicators
   - Single value display

7. **Globe Map** (`type: "globe"`)
   - Geographic data
   - 3D interactive globe

---

## Troubleshooting

### Backend Issues

**Error: GOOGLE_API_KEY not set**
- Ensure `.env` file exists in `gendash-engine/`
- Verify the API key is valid

**Error: Module not found**
- Run `pip install -r requirements.txt`
- Ensure Python 3.11+ is being used

**CORS errors**
- Check that CORS is enabled in `app.py`
- Verify frontend is using correct API URL

### Frontend Issues

**Error: Failed to fetch**
- Ensure backend is running on port 8080
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Blank dashboard**
- Check browser console for errors
- Verify API returned valid data
- Check that data format matches chart requirements

---

## Project Structure

```
Gendash/
├── gendash-engine/          # Backend (Flask + LangChain)
│   ├── app.py               # Main Flask application
│   ├── dashboard_generator.py  # LangChain dashboard generator
│   ├── data_analyzer.py     # Data analysis heuristics
│   ├── schemas.py           # Pydantic data models
│   └── requirements.txt     # Python dependencies
│
├── gendash-frontend/        # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx        # Landing page with prompt box
│   │   ├── loading/page.tsx  # Loading state page
│   │   ├── dashboard/[id]/page.tsx  # Dynamic dashboard page
│   │   └── components/     # React components
│   │       └── charts/     # Dynamic chart components
│   ├── lib/
│   │   └── api.ts          # API service utilities
│   └── package.json        # Node dependencies
│
└── SRS.md                   # Software Requirements Specification
```

---

## Next Steps

1. **Add Firebase Integration**: For saving and retrieving dashboards
2. **Implement Authentication**: User accounts and private dashboards
3. **Add More Chart Types**: Scatter plots, heatmaps, etc.
4. **Deploy to Production**: Docker + Google Cloud Run
5. **Add Export Features**: PDF, PNG, CSV exports

---

## Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [LangChain Documentation](https://python.langchain.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

## Support

For issues or questions, please refer to the SRS.md file or create an issue in the repository.
