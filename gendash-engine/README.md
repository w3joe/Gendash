# Gendash Engine

AI-powered backend engine for automatic dashboard generation using LangChain and Google Gemini.

## Architecture

The Gendash Engine uses a sophisticated AI pipeline to analyze API data and generate optimal dashboard specifications:

```
API Data → Data Analyzer → LangChain Prompt → Gemini LLM → Pydantic Parser → Dashboard Spec
```

## Components

### 1. **Pydantic Schemas** (`schemas.py`)
- `DashboardComponent`: Individual visualization component (charts, metrics, tables)
- `DashboardSpec`: Complete dashboard specification with layout and theme
- `DataAnalysisResult`: Results from data analysis heuristics
- Comprehensive validation rules ensuring data integrity

### 2. **Data Analyzer** (`data_analyzer.py`)
Implements intelligent data analysis:
- **Type Detection**: Automatically identifies numeric, categorical, temporal, and boolean fields
- **Time Series Detection**: Recognizes date/time patterns in data
- **Metric Identification**: Finds potential KPIs and key metrics
- **Cardinality Analysis**: Calculates unique value counts
- **Chart Recommendations**: Suggests appropriate visualization types

### 3. **Dashboard Generator** (`dashboard_generator.py`)
LangChain-powered generation engine:
- **Gemini Integration**: Uses Gemini 1.5 Pro with optimized temperature (0.3)
- **Pydantic Output Parser**: Ensures structured, validated output
- **Dynamic Prompts**: Incorporates data insights and heuristics
- **Retry Logic**: Exponential backoff for API failures
- **Fallback Templates**: Graceful degradation when AI generation fails

### 4. **Flask API** (`app.py`)
HTTP interface for frontend:
- `POST /api/generate-dashboard`: Generate dashboard from API URL
- `GET /api/dashboard/:id`: Retrieve saved dashboard
- `POST /api/analyze-data`: Analyze API data without generation
- `GET /health`: Health check endpoint

## Setup

### Prerequisites
- Python 3.11+
- Google API Key for Gemini

### Installation

1. **Create virtual environment**:
```bash
cd gendash-engine
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Configure environment**:
Create `.env` file:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8080
FLASK_ENV=development
```

### Running the Server

**Development**:
```bash
python app.py
```

**Production** (using Gunicorn):
```bash
gunicorn -w 4 -b 0.0.0.0:8080 app:app
```

## API Usage

### Generate Dashboard

```bash
POST http://localhost:8080/api/generate-dashboard
Content-Type: application/json

{
  "apiUrl": "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2020-01-01&endtime=2020-01-02",
  "preferences": {
    "colorScheme": "default",
    "layout": "auto"
  }
}
```

**Response**:
```json
{
  "success": true,
  "dashboardId": "abc123def456",
  "spec": {
    "components": [...],
    "layout": {...},
    "metadata": {...},
    "theme": {...}
  }
}
```

### Analyze Data

```bash
POST http://localhost:8080/api/analyze-data
Content-Type: application/json

{
  "apiUrl": "https://api.example.com/data"
}
```

## Features Implemented

### FR-1: Component Model ✅
- Comprehensive DashboardComponent schema
- Support for 8 visualization types (line, bar, pie, area, table, metric, scatter, heatmap)
- Validated data mappings and positioning

### FR-2: Dashboard Specification Model ✅
- Complete DashboardSpec with components, layout, metadata, theme
- Grid-based layout system (12-column)
- Customizable themes

### FR-3: Validation Rules ✅
- Component type enum validation
- Position coordinate validation (non-negative integers)
- No duplicate component IDs
- Grid boundary checking
- Overlap detection

### FR-4: Gemini LLM Configuration ✅
- Model: gemini-1.5-pro
- Temperature: 0.3 (for consistency)
- Max tokens: 4096
- Retry logic with exponential backoff

### FR-5: Output Parser Setup ✅
- PydanticOutputParser with DashboardSpec
- Automatic schema generation
- JSON validation

### FR-6: Prompt Template Construction ✅
- System instructions defining AI role
- Dynamic data insights injection
- Format instructions from parser
- Few-shot learning examples

### FR-7: Chain Assembly ✅
- LCEL pipeline: `prompt | llm | parser`
- Error propagation and type checking
- Retry logic for transient failures

### FR-8: API Data Analysis ✅
- Automatic type detection
- Cardinality calculation
- Null percentage analysis
- Data classification (time-series, aggregated, transactional)

### FR-9: Heuristics Layer ✅
- `TimeSeriesDetector`: Identifies temporal patterns
- `MetricCalculator`: Finds KPIs
- `RelationshipMapper`: Detects foreign keys
- `ChartTypeRecommender`: Suggests visualizations

### FR-10: Prompt Engineering ✅
- Dynamic prompts with data samples
- Schema information inclusion
- Heuristics output integration
- Specific visualization requirements

## Data Flow

1. **API Request**: Frontend sends API URL to `/api/generate-dashboard`
2. **Data Fetch**: Engine fetches data from provided API endpoint
3. **Data Analysis**: DataAnalyzer examines data structure and patterns
4. **Prompt Construction**: Dynamic prompt built with analysis results
5. **LLM Generation**: Gemini processes prompt and generates spec
6. **Validation**: Pydantic parser validates output structure
7. **Response**: Validated dashboard spec returned to frontend

## Error Handling

- **API Fetch Errors**: Clear error messages for invalid URLs or failed requests
- **Empty Data**: Graceful handling with appropriate error responses
- **LLM Failures**: Automatic retry with exponential backoff
- **Validation Errors**: Detailed error messages from Pydantic
- **Fallback Mode**: Basic template generation when AI fails

## Testing

Test with example APIs:

```bash
# Earthquake data (GeoJSON)
curl -X POST http://localhost:8080/api/generate-dashboard \
  -H "Content-Type: application/json" \
  -d '{"apiUrl":"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2020-01-01&endtime=2020-01-02"}'

# Fake store products (REST)
curl -X POST http://localhost:8080/api/generate-dashboard \
  -H "Content-Type: application/json" \
  -d '{"apiUrl":"https://fakestoreapi.com/products"}'

# Security breaches (REST)
curl -X POST http://localhost:8080/api/generate-dashboard \
  -H "Content-Type: application/json" \
  -d '{"apiUrl":"https://haveibeenpwned.com/api/v2/breaches"}'
```

## Performance

- **Average Generation Time**: 3-8 seconds
- **Retry Attempts**: Up to 3 with exponential backoff
- **Timeout**: 30 seconds for API data fetch
- **Concurrency**: Supports multiple simultaneous requests

## Future Enhancements

- [ ] Database storage for generated dashboards
- [ ] User authentication and dashboard management
- [ ] Real-time data refresh capabilities
- [ ] Custom visualization templates
- [ ] A/B testing for prompt optimization
- [ ] Caching layer for common API patterns
- [ ] Webhook support for data updates

## License

See main repository LICENSE file.
