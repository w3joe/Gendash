"""
LangChain-based dashboard generation engine.
Implements FR-4, FR-5, FR-6, FR-7, and FR-10 from requirements.
"""

import os
import json
import pandas as pd
from typing import Dict, List, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from tenacity import retry, stop_after_attempt, wait_exponential

from schemas import DashboardSpec, DataAnalysisResult
from data_analyzer import DataAnalyzer


class DashboardGenerator:
    """
    Orchestrates dashboard generation using LangChain and Gemini.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the dashboard generator.

        Args:
            api_key: Google API key for Gemini. If None, reads from environment.
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY must be provided or set in environment")

        # FR-4: Gemini LLM Configuration
        self.llm = self._initialize_llm()

        # FR-5: Output Parser Setup
        self.output_parser = PydanticOutputParser(pydantic_object=DashboardSpec)

        # FR-6: Prompt Template Construction
        self.prompt_template = self._create_prompt_template()

    def _initialize_llm(self) -> ChatGoogleGenerativeAI:
        """
        Implements FR-4: Gemini LLM Configuration with retry logic.
        """
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=self.api_key,
            temperature=0.3,  # Low temperature for consistency
            max_output_tokens=4096,
            convert_system_message_to_human=True
        )

    def _create_prompt_template(self) -> PromptTemplate:
        """
        Implements FR-6: Prompt Template Construction.
        Creates a comprehensive prompt template for dashboard generation.
        """
        format_instructions = self.output_parser.get_format_instructions()

        template = """You are an expert dashboard architect AI specializing in data visualization and analytics. Your task is to analyze the provided data and generate a complete, production-ready dashboard specification.

# Your Role
- Analyze data characteristics, patterns, and relationships
- Select appropriate visualization types based on data structure
- Create an intuitive, professional dashboard layout
- Ensure all visualizations are meaningful and actionable

# Data Information
API Endpoint: {api_endpoint}

Data Schema:
{data_schema}

Data Analysis Results:
- Data Types: {data_types}
- Is Time Series: {is_time_series}
- Time Fields: {time_fields}
- Numeric Fields: {numeric_fields}
- Categorical Fields: {categorical_fields}
- Key Metrics: {key_metrics}
- Field Cardinality: {cardinality}
- Null Percentages: {null_percentages}
- Recommended Chart Types: {recommended_charts}

Sample Data (first 10 rows):
{sample_data}

# Dashboard Requirements
1. Create AT LEAST 4-6 diverse components including:
   - Metric cards for key KPIs (2-4 cards)
   - At least 2 trend visualizations (line/area charts if time series data exists)
   - At least 1 comparative visualization (bar chart for categories)
   - At least 1 distribution/composition chart (pie chart for proportions)
   - A data table for detailed view

2. Component Placement Rules:
   - Use a 12-column grid system
   - Metric cards: typically 3 columns wide (4 metrics across)
   - Charts: 6 columns wide (2 per row) or 12 columns for prominent charts
   - Tables: full width (12 columns)
   - Arrange components logically: metrics at top, charts in middle, table at bottom

3. Data Mapping Guidelines:
   - For LINE charts: xAxis should be time field, yAxis should be numeric field(s)
   - For BAR charts: xAxis should be categorical field, yAxis should be numeric field
   - For PIE charts: label should be categorical field, value should be numeric field
   - For AREA charts: xAxis should be time field, yAxis/series should be numeric fields
   - For METRIC cards: value should be a key metric field
   - For TABLE: include all or most important fields

4. Title Naming:
   - Use clear, professional titles that describe what the visualization shows
   - Examples: "Monthly Revenue Trend", "Sales by Category", "Top Products"

# Output Format
{format_instructions}

# Important Instructions
- Output ONLY valid JSON matching the schema above
- Do NOT include markdown code blocks, explanations, or any text outside the JSON
- Ensure all component IDs are unique and follow format: metric_1, chart_1, table_1, etc.
- Map data fields correctly to ensure visualizations will render properly
- Position components so they don't overlap and fit within the 12-column grid
- Use professional, descriptive titles for all components

Generate the dashboard specification now:"""

        return PromptTemplate(
            template=template,
            input_variables=[
                "api_endpoint",
                "data_schema",
                "data_types",
                "is_time_series",
                "time_fields",
                "numeric_fields",
                "categorical_fields",
                "key_metrics",
                "cardinality",
                "null_percentages",
                "recommended_charts",
                "sample_data"
            ],
            partial_variables={"format_instructions": format_instructions}
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def generate_dashboard(
        self,
        api_endpoint: str,
        data: List[Dict[str, Any]]
    ) -> DashboardSpec:
        """
        Generate a complete dashboard specification from API data.

        Implements FR-7: Chain Assembly and FR-10: Prompt Engineering

        Args:
            api_endpoint: The API endpoint URL
            data: List of dictionaries containing the API response data

        Returns:
            DashboardSpec: Validated dashboard specification

        Raises:
            ValueError: If data is empty or generation fails
        """
        if not data:
            raise ValueError("Cannot generate dashboard from empty data")

        # FR-8 & FR-9: Data Analysis and Heuristics
        analyzer = DataAnalyzer(data)
        analysis = analyzer.analyze()

        # FR-10: Construct dynamic prompt with data insights
        prompt_inputs = self._prepare_prompt_inputs(api_endpoint, analysis)

        # FR-7: LCEL Chain Assembly (prompt | llm | parser)
        chain = self.prompt_template | self.llm | self.output_parser

        try:
            # Execute the chain
            dashboard_spec = chain.invoke(prompt_inputs)
            return dashboard_spec
        except Exception as e:
            # Fallback: try with simpler prompt or return default spec
            print(f"Error generating dashboard: {e}")
            raise

    def _prepare_prompt_inputs(
        self,
        api_endpoint: str,
        analysis: DataAnalysisResult
    ) -> Dict[str, str]:
        """
        Prepare input variables for the prompt template.

        Args:
            api_endpoint: The API endpoint URL
            analysis: DataAnalysisResult from data analysis

        Returns:
            Dictionary of prompt input variables
        """
        return {
            "api_endpoint": api_endpoint,
            "data_schema": json.dumps(analysis.dataTypes, indent=2),
            "data_types": json.dumps(analysis.dataTypes),
            "is_time_series": str(analysis.isTimeSeries),
            "time_fields": json.dumps(analysis.timeFields),
            "numeric_fields": json.dumps(analysis.numericFields),
            "categorical_fields": json.dumps(analysis.categoricalFields),
            "key_metrics": json.dumps(analysis.keyMetrics),
            "cardinality": json.dumps(analysis.cardinality),
            "null_percentages": json.dumps(analysis.nullPercentages),
            "recommended_charts": json.dumps(analysis.recommendedCharts),
            "sample_data": json.dumps(analysis.sampleData[:5], indent=2, default=str)  # First 5 rows for brevity
        }

    def generate_dashboard_with_fallback(
        self,
        api_endpoint: str,
        data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate dashboard with fallback to default template on failure.

        Args:
            api_endpoint: The API endpoint URL
            data: List of dictionaries containing the API response data

        Returns:
            Dictionary representation of dashboard spec
        """
        try:
            dashboard_spec = self.generate_dashboard(api_endpoint, data)
            return dashboard_spec.model_dump()
        except Exception as e:
            print(f"Dashboard generation failed: {e}. Using fallback template.")
            return self._create_fallback_dashboard(api_endpoint, data)

    def _create_fallback_dashboard(
        self,
        api_endpoint: str,
        data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create a basic fallback dashboard when AI generation fails.

        Args:
            api_endpoint: The API endpoint URL
            data: The data to visualize

        Returns:
            Dictionary representation of a basic dashboard spec
        """
        analyzer = DataAnalyzer(data)
        analysis = analyzer.analyze()

        components = []
        y_pos = 0

        # Add metric cards for key metrics
        for i, metric in enumerate(analysis.keyMetrics[:4]):
            components.append({
                "id": f"metric_{i+1}",
                "type": "metric",
                "title": metric.replace('_', ' ').title(),
                "dataMapping": {
                    "value": metric
                },
                "position": {
                    "x": (i % 4) * 3,
                    "y": 0,
                    "width": 3,
                    "height": 1
                }
            })
        y_pos = 1

        # Add a line chart if time series
        if analysis.isTimeSeries and analysis.timeFields and analysis.numericFields:
            components.append({
                "id": "chart_1",
                "type": "line",
                "title": "Trend Over Time",
                "dataMapping": {
                    "xAxis": analysis.timeFields[0],
                    "yAxis": analysis.numericFields[0]
                },
                "position": {
                    "x": 0,
                    "y": y_pos,
                    "width": 12,
                    "height": 2
                }
            })
            y_pos += 2

        # Add a bar chart if categorical data
        if analysis.categoricalFields and analysis.numericFields:
            components.append({
                "id": "chart_2",
                "type": "bar",
                "title": "Comparison by Category",
                "dataMapping": {
                    "xAxis": analysis.categoricalFields[0],
                    "yAxis": analysis.numericFields[0]
                },
                "position": {
                    "x": 0,
                    "y": y_pos,
                    "width": 6,
                    "height": 2
                }
            })

            # Add pie chart
            components.append({
                "id": "chart_3",
                "type": "pie",
                "title": "Distribution",
                "dataMapping": {
                    "label": analysis.categoricalFields[0],
                    "value": analysis.numericFields[0]
                },
                "position": {
                    "x": 6,
                    "y": y_pos,
                    "width": 6,
                    "height": 2
                }
            })
            y_pos += 2

        # Add table
        components.append({
            "id": "table_1",
            "type": "table",
            "title": "Data Table",
            "dataMapping": {},
            "position": {
                "x": 0,
                "y": y_pos,
                "width": 12,
                "height": 2
            }
        })

        return {
            "components": components,
            "layout": {
                "columns": 12,
                "rows": y_pos + 2,
                "gap": 16,
                "padding": 16
            },
            "metadata": {
                "title": "Dashboard Analytics",
                "description": "Auto-generated dashboard",
                "apiEndpoint": api_endpoint,
                "createdAt": str(pd.Timestamp.now()),
                "dataSchema": analysis.dataTypes
            },
            "theme": {
                "primaryColor": "#3b82f6",
                "secondaryColor": "#a855f7",
                "backgroundColor": "#18181b",
                "textColor": "#f4f4f5",
                "fontFamily": "Inter, sans-serif"
            }
        }
