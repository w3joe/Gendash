"""
Flask API for Gendash dashboard generation.
Main HTTP interface for frontend requests.
"""

import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any
import traceback

from dashboard_generator import DashboardGenerator
from schemas import DashboardSpec

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Initialize dashboard generator
generator = None

def get_generator():
    """Lazy initialization of dashboard generator."""
    global generator
    if generator is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        generator = DashboardGenerator(api_key=api_key)
    return generator


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "gendash-engine",
        "version": "1.0.0"
    })


@app.route('/api/generate-dashboard', methods=['POST'])
def generate_dashboard():
    """
    Generate dashboard from API endpoint.

    Request Body:
    {
        "apiUrl": "https://api.example.com/data",
        "preferences": {
            "colorScheme": "default",
            "layout": "auto"
        }
    }

    Response:
    {
        "dashboardId": "unique-id",
        "spec": { ... dashboard specification ... },
        "success": true
    }
    """
    try:
        # Parse request
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is required"
            }), 400

        api_url = data.get('apiUrl')
        if not api_url:
            return jsonify({
                "success": False,
                "error": "apiUrl is required"
            }), 400

        # Fetch data from API
        print(f"\n{'='*80}")
        print(f"Fetching data from: {api_url}")
        print(f"{'='*80}")
        try:
            response = requests.get(api_url, timeout=30)
            response.raise_for_status()
            api_data = response.json()
            
            # Print raw API response
            print(f"\n[API Response] Raw data structure:")
            print(f"Type: {type(api_data)}")
            if isinstance(api_data, dict):
                print(f"Keys: {list(api_data.keys())}")
                print(f"Sample keys content (first 200 chars): {str(api_data)[:200]}")
            elif isinstance(api_data, list):
                print(f"Array length: {len(api_data)}")
                if len(api_data) > 0:
                    print(f"First item keys: {list(api_data[0].keys()) if isinstance(api_data[0], dict) else 'Not a dict'}")
                    print(f"First item sample: {str(api_data[0])[:300]}")
            
        except requests.RequestException as e:
            return jsonify({
                "success": False,
                "error": f"Failed to fetch data from API: {str(e)}"
            }), 400
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": "API response is not valid JSON"
            }), 400

        # Handle different API response formats
        original_data = api_data
        if isinstance(api_data, dict):
            # Check for common pagination/wrapper patterns
            if 'data' in api_data:
                api_data = api_data['data']
                print(f"[API Response] Extracted 'data' field")
            elif 'results' in api_data:
                api_data = api_data['results']
                print(f"[API Response] Extracted 'results' field")
            elif 'items' in api_data:
                api_data = api_data['items']
                print(f"[API Response] Extracted 'items' field")
            elif 'features' in api_data:  # GeoJSON format
                api_data = api_data['features']
                print(f"[API Response] Extracted 'features' field (GeoJSON)")
            else:
                print(f"[API Response] No standard wrapper found, using root object")

        # Ensure data is a list
        if not isinstance(api_data, list):
            # If it's a single object, wrap it in a list
            api_data = [api_data] if isinstance(api_data, dict) else []
            print(f"[API Response] Wrapped single object into array")

        if not api_data:
            return jsonify({
                "success": False,
                "error": "API returned empty or invalid data"
            }), 400

        print(f"\n[API Response] Final processed data:")
        print(f"Total records: {len(api_data)}")
        if len(api_data) > 0 and isinstance(api_data[0], dict):
            print(f"Fields in first record: {list(api_data[0].keys())}")
            print(f"First record sample: {json.dumps(api_data[0], indent=2, default=str)[:500]}")
        print(f"{'='*80}\n")

        # Generate dashboard
        gen = get_generator()
        dashboard_spec = gen.generate_dashboard_with_fallback(api_url, api_data)

        # Generate unique dashboard ID
        import hashlib
        import time
        dashboard_id = hashlib.md5(f"{api_url}{time.time()}".encode()).hexdigest()[:12]

        # Store dashboard spec (in production, save to database)
        # For now, just return it

        return jsonify({
            "success": True,
            "dashboardId": dashboard_id,
            "spec": dashboard_spec
        })

    except Exception as e:
        print(f"Error generating dashboard: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500


@app.route('/api/dashboard/<dashboard_id>', methods=['GET'])
def get_dashboard(dashboard_id: str):
    """
    Retrieve a generated dashboard by ID.

    In production, this would fetch from database.
    For now, returns a placeholder.
    """
    return jsonify({
        "success": True,
        "dashboardId": dashboard_id,
        "message": "Dashboard retrieval not yet implemented"
    })


@app.route('/api/analyze-data', methods=['POST'])
def analyze_data():
    """
    Analyze API data without generating dashboard.
    Useful for debugging and understanding data characteristics.

    Request Body:
    {
        "apiUrl": "https://api.example.com/data"
    }

    Response:
    {
        "analysis": { ... data analysis results ... },
        "success": true
    }
    """
    try:
        data = request.get_json()
        api_url = data.get('apiUrl')

        if not api_url:
            return jsonify({
                "success": False,
                "error": "apiUrl is required"
            }), 400

        # Fetch data
        response = requests.get(api_url, timeout=30)
        response.raise_for_status()
        api_data = response.json()

        # Handle response format
        if isinstance(api_data, dict):
            if 'data' in api_data:
                api_data = api_data['data']
            elif 'results' in api_data:
                api_data = api_data['results']

        if not isinstance(api_data, list):
            api_data = [api_data]

        # Analyze data
        from data_analyzer import DataAnalyzer
        analyzer = DataAnalyzer(api_data)
        analysis = analyzer.analyze()

        # Safely serialize the analysis. model_dump() may fail in rare cases
        # if the model contains unexpected/unhashable internal types. Try
        # using model_dump(), and fallback to a manual construction using the
        # analyzer's raw data if that fails.
        try:
            analysis_payload = analysis.model_dump()
        except Exception:
            print("Warning: model_dump() failed for DataAnalysisResult, falling back to manual serialization")
            print(traceback.format_exc())
            # Build a conservative, JSON-serializable payload
            analysis_payload = {
                "dataTypes": getattr(analysis, 'dataTypes', {}),
                "isTimeSeries": getattr(analysis, 'isTimeSeries', False),
                "timeFields": getattr(analysis, 'timeFields', []),
                "numericFields": getattr(analysis, 'numericFields', []),
                "categoricalFields": getattr(analysis, 'categoricalFields', []),
                "keyMetrics": getattr(analysis, 'keyMetrics', []),
                "cardinality": getattr(analysis, 'cardinality', {}),
                "nullPercentages": getattr(analysis, 'nullPercentages', {}),
                "recommendedCharts": getattr(analysis, 'recommendedCharts', []),
                # Return original raw sample rows (not sanitized) to preserve structure
                "sampleData": getattr(analyzer, 'raw_data', [])[:10]
            }

        return jsonify({
            "success": True,
            "analysis": analysis_payload
        })

    except Exception as e:
        print(f"Error analyzing data: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


if __name__ == '__main__':
    # Check for API key
    if not os.getenv("GOOGLE_API_KEY"):
        print("WARNING: GOOGLE_API_KEY environment variable not set")
        print("Please set it in .env file or environment")

    # Run development server
    port = int(os.getenv("PORT", 8080))
    debug = os.getenv("FLASK_ENV") == "development"

    print(f"Starting Gendash Engine on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
