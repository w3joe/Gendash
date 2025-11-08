"""
Pydantic schemas for dashboard specification and validation.
Implements FR-1, FR-2, and FR-3 from requirements.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator, model_validator


class ComponentType(str, Enum):
    """Valid component types for dashboard visualizations."""
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    AREA = "area"
    TABLE = "table"
    METRIC = "metric"
    SCATTER = "scatter"
    HEATMAP = "heatmap"
    GLOBE = "globe"
    HORIZONTAL_BAR = "horizontalBar"


class DataMapping(BaseModel):
    """Mapping configuration for chart data fields."""
    xAxis: Optional[str] = Field(None, description="Field name for X-axis")
    yAxis: Optional[str | List[str]] = Field(None, description="Field name(s) for Y-axis")
    value: Optional[str] = Field(None, description="Field name for value (used in pie charts, metrics)")
    label: Optional[str] = Field(None, description="Field name for labels")
    category: Optional[str] = Field(None, description="Field name for categories")
    series: Optional[List[str]] = Field(None, description="Multiple series for multi-line/area charts")
    lat: Optional[str] = Field(None, description="Field name for latitude (used in globe maps)")
    lon: Optional[str] = Field(None, description="Field name for longitude (used in globe maps)")
    xKey: Optional[str] = Field(None, description="Field name for x-axis (alternative to xAxis)")
    yKey: Optional[str] = Field(None, description="Field name for y-axis (alternative to yAxis)")
    yKeys: Optional[List[str]] = Field(None, description="Field names for multiple y-axes (alternative to yAxis)")
    labelKey: Optional[str] = Field(None, description="Field name for labels (alternative to label)")
    valueKey: Optional[str] = Field(None, description="Field name for values (alternative to value)")

    @field_validator('xAxis', 'value', 'label', 'category')
    @classmethod
    def validate_field_names(cls, v):
        """Ensure field names are non-empty strings."""
        if v is not None and isinstance(v, str) and len(v.strip()) == 0:
            raise ValueError("Field names cannot be empty strings")
        return v


class DashboardComponent(BaseModel):
    """
    Individual dashboard component specification.
    Implements FR-1: Component Model
    Simplified to include only essential chart configuration.
    """
    id: str = Field(..., min_length=1, description="Unique component identifier")
    type: ComponentType = Field(..., description="Type of visualization component")
    title: str = Field(..., min_length=1, description="Display title for the component")
    dataMapping: DataMapping = Field(..., description="Configuration for data field mappings")
    description: Optional[str] = Field(None, description="Optional component description")

    @field_validator('id')
    @classmethod
    def validate_id_format(cls, v):
        """Ensure ID follows valid format (alphanumeric with underscores/hyphens)."""
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("Component ID must contain only alphanumeric characters, underscores, or hyphens")
        return v


class DashboardSpec(BaseModel):
    """
    Complete dashboard specification.
    Implements FR-2: Dashboard Specification Model
    Simplified to include only components array.
    """
    components: List[DashboardComponent] = Field(..., min_length=1, description="List of dashboard components")

    @model_validator(mode='after')
    def validate_no_duplicate_ids(self):
        """
        Implements FR-3: Validation Rules - Ensure no duplicate component IDs.
        """
        component_ids = [comp.id for comp in self.components]
        if len(component_ids) != len(set(component_ids)):
            duplicates = [id for id in component_ids if component_ids.count(id) > 1]
            raise ValueError(f"Duplicate component IDs found: {set(duplicates)}")
        return self


class DataAnalysisResult(BaseModel):
    """Result from data analysis heuristics."""
    dataTypes: Dict[str, str] = Field(..., description="Field name to data type mapping")
    isTimeSeries: bool = Field(..., description="Whether data contains time series")
    timeFields: List[str] = Field(default_factory=list, description="Detected time/date fields")
    numericFields: List[str] = Field(default_factory=list, description="Numeric fields")
    categoricalFields: List[str] = Field(default_factory=list, description="Categorical fields")
    keyMetrics: List[str] = Field(default_factory=list, description="Potential KPI fields")
    cardinality: Dict[str, int] = Field(default_factory=dict, description="Unique value counts per field")
    nullPercentages: Dict[str, float] = Field(default_factory=dict, description="Null percentage per field")
    recommendedCharts: List[str] = Field(default_factory=list, description="Recommended chart types")
    sampleData: List[Dict[str, Any]] = Field(default_factory=list, description="Sample rows from data")
