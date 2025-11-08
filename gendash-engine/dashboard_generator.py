"""
LangChain-based dashboard generation engine.
Implements FR-4, FR-5, FR-6, FR-7, and FR-10 from requirements.
"""

import os
import json
from typing import Dict, List, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from tenacity import retry, stop_after_attempt, wait_exponential

from schemas import DashboardSpec, DataAnalysisResult, ComponentType
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
        
        # Create a wrapper parser that handles JSON extraction
        self._raw_parser = self.output_parser

        # FR-6: Prompt Template Construction
        self.prompt_template = self._create_prompt_template()

    def _initialize_llm(self) -> ChatGoogleGenerativeAI:
        """
        Implements FR-4: Gemini LLM Configuration with retry logic.
        """
        return ChatGoogleGenerativeAI(
            model="gemini-flash-latest",
            google_api_key=self.api_key,
            temperature=0.3,  # Low temperature for consistency
            max_output_tokens=4096,
            convert_system_message_to_human=True
        )

    def _create_prompt_template(self) -> PromptTemplate:
        """
        Implements FR-6: Prompt Template Construction.
        Creates an optimized, concise prompt template for dashboard generation.
        """
        format_instructions = self.output_parser.get_format_instructions()

        template = """Generate dashboard components from API data. Select 2-4 chart types from: line, bar, horizontalBar, pie, metric, table, globe.

Data Summary:
Fields: {field_summary}
Sample: {sample_data}

Chart Types (use EXACT type names):
- line: xKey (time/seq), yKeys[] (numeric)
- bar: xKey (cat), yKey (num)
- horizontalBar: yKey (cat), xKey (num) - NOTE: type must be "horizontalBar" exactly
- pie: labelKey (cat), valueKey (num)
- metric: value (calc from num field)
- table: columns[] (optional)
- globe: lat (latitude num), lon (longitude num), value (num), label (opt string). Use when data has lat/lon/coordinates.

Rules:
1. Use exact field names from data
2. Output ONLY valid JSON - no markdown, no code blocks, no explanations
3. Each component: id, type, title, dataMapping
4. Type must be one of: "line", "bar", "horizontalBar", "pie", "metric", "table", "globe"
5. No layout/styling/position
6. Prefer globe if fields contain: lat/latitude/lat, lon/longitude/lng/long, coordinates

Output format: {{"components": [{{"id": "...", "type": "...", "title": "...", "dataMapping": {{...}}}}]}}

{format_instructions}"""

        return PromptTemplate(
            template=template,
            input_variables=[
                "field_summary",
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
            result = chain.invoke(prompt_inputs)
            return result
        except Exception as e:
            # Try to extract JSON from markdown code blocks if parsing failed
            error_msg = str(e)
            if "Failed to parse" in error_msg or "Expecting value" in error_msg or "validation error" in error_msg.lower():
                print(f"Parsing error detected, attempting to extract and fix JSON from LLM response...")
                # Re-invoke to get raw response
                try:
                    raw_response = (self.prompt_template | self.llm).invoke(prompt_inputs)
                    content = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)
                    
                    print(f"Raw LLM response (first 1000 chars): {content[:1000]}")
                    
                    # Extract JSON from markdown code blocks
                    import re
                    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(1)
                    else:
                        # Try to find JSON object directly (more greedy match)
                        json_match = re.search(r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', content, re.DOTALL)
                        if json_match:
                            json_str = json_match.group(1)
                        else:
                            # Last resort: find anything that looks like JSON
                            json_match = re.search(r'(\{.*\})', content, re.DOTALL)
                            if json_match:
                                json_str = json_match.group(1)
                            else:
                                raise ValueError("Could not extract JSON from response")
                    
                    print(f"Extracted JSON (first 500 chars): {json_str[:500]}")
                    
                    # Parse the extracted JSON
                    parsed_data = json.loads(json_str)
                    
                    # Normalize component types to match enum values
                    if 'components' in parsed_data:
                        valid_types = [e.value for e in ComponentType]
                        for component in parsed_data['components']:
                            if 'type' in component:
                                type_value = component['type']
                                # Normalize common variations
                                type_normalized = type_value.lower().strip()
                                if type_normalized == 'horizontalbar' or type_normalized == 'horizontal_bar':
                                    component['type'] = 'horizontalBar'
                                    print(f"Normalized type '{type_value}' to 'horizontalBar'")
                                elif type_normalized not in valid_types:
                                    # Try to find matching enum value (case-insensitive)
                                    found = False
                                    for enum_val in ComponentType:
                                        if enum_val.value.lower() == type_normalized:
                                            component['type'] = enum_val.value
                                            print(f"Normalized type '{type_value}' to '{enum_val.value}'")
                                            found = True
                                            break
                                    if not found:
                                        print(f"Warning: Unknown component type '{type_value}', keeping as-is")
                    
                    dashboard_spec = DashboardSpec(**parsed_data)
                    print(f"Successfully parsed dashboard spec with {len(dashboard_spec.components)} components")
                    return dashboard_spec
                except Exception as parse_error:
                    print(f"Failed to extract JSON from response: {parse_error}")
                    import traceback
                    print(traceback.format_exc())
                    if 'content' in locals():
                        print(f"Raw response content (full): {content}")
                    raise e
            
            # Fallback: try with simpler prompt or return default spec
            print(f"Error generating dashboard: {e}")
            import traceback
            print(traceback.format_exc())
            raise

    def _prepare_prompt_inputs(
        self,
        api_endpoint: str,
        analysis: DataAnalysisResult
    ) -> Dict[str, str]:
        """
        Prepare optimized, compact input variables for the prompt template.
        Reduces token usage by consolidating data representation.

        Args:
            api_endpoint: The API endpoint URL (kept for reference but not used in prompt)
            analysis: DataAnalysisResult from data analysis

        Returns:
            Dictionary of prompt input variables
        """
        # Create compact field summary: "field:type" format
        field_parts = []
        for field, dtype in analysis.dataTypes.items():
            tags = []
            if field in analysis.timeFields:
                tags.append("T")
            if field in analysis.numericFields:
                tags.append("N")
            if field in analysis.categoricalFields:
                tags.append("C")
            if field in analysis.keyMetrics:
                tags.append("K")
            tag_str = f"[{''.join(tags)}]" if tags else ""
            field_parts.append(f"{field}:{dtype}{tag_str}")
        
        field_summary = ", ".join(field_parts)
        
        # Compact sample data - only 2 rows, minimal formatting
        sample_rows = analysis.sampleData[:2]
        # Create a more compact representation
        if sample_rows:
            # Get field names from first row
            first_row = sample_rows[0]
            if isinstance(first_row, dict):
                # Only include key fields to save tokens
                key_fields = (
                    analysis.timeFields[:1] + 
                    analysis.numericFields[:2] + 
                    analysis.categoricalFields[:1]
                )[:4]  # Max 4 fields
                compact_sample = []
                for row in sample_rows:
                    compact_row = {k: v for k, v in row.items() if k in key_fields}
                    # Truncate long string values
                    for k, v in compact_row.items():
                        if isinstance(v, str) and len(v) > 30:
                            compact_row[k] = v[:27] + "..."
                    compact_sample.append(compact_row)
                sample_data = json.dumps(compact_sample, default=str, separators=(',', ':'))
            else:
                sample_data = json.dumps(sample_rows[:2], default=str, separators=(',', ':'))
        else:
            sample_data = "[]"
        
        return {
            "field_summary": field_summary,
            "sample_data": sample_data
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
            api_endpoint: The API endpoint URL (unused but kept for interface consistency)
            data: The data to visualize

        Returns:
            Dictionary representation of a basic dashboard spec (components only)
        """
        analyzer = DataAnalyzer(data)
        analysis = analyzer.analyze()

        components = []

        # Add metric cards for key metrics
        for i, metric in enumerate(analysis.keyMetrics[:3]):
            components.append({
                "id": f"metric_{i+1}",
                "type": "metric",
                "title": metric.replace('_', ' ').title(),
                "dataMapping": {
                    "value": metric
                }
            })

        # Add a line chart if time series
        if analysis.isTimeSeries and analysis.timeFields and analysis.numericFields:
            components.append({
                "id": "chart_1",
                "type": "line",
                "title": "Trend Over Time",
                "dataMapping": {
                    "xAxis": analysis.timeFields[0],
                    "yAxis": analysis.numericFields[0]
                }
            })

        # Add a bar chart if categorical data
        if analysis.categoricalFields and analysis.numericFields:
            components.append({
                "id": "chart_2",
                "type": "bar",
                "title": "Comparison by Category",
                "dataMapping": {
                    "xAxis": analysis.categoricalFields[0],
                    "yAxis": analysis.numericFields[0]
                }
            })

        # Add table
        components.append({
            "id": "table_1",
            "type": "table",
            "title": "Data Table",
            "dataMapping": {}
        })

        return {
            "components": components
        }
