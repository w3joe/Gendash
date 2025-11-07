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


class DataMapping(BaseModel):
    """Mapping configuration for chart data fields."""
    xAxis: Optional[str] = Field(None, description="Field name for X-axis")
    yAxis: Optional[str | List[str]] = Field(None, description="Field name(s) for Y-axis")
    value: Optional[str] = Field(None, description="Field name for value (used in pie charts, metrics)")
    label: Optional[str] = Field(None, description="Field name for labels")
    category: Optional[str] = Field(None, description="Field name for categories")
    series: Optional[List[str]] = Field(None, description="Multiple series for multi-line/area charts")

    @field_validator('xAxis', 'value', 'label', 'category')
    @classmethod
    def validate_field_names(cls, v):
        """Ensure field names are non-empty strings."""
        if v is not None and isinstance(v, str) and len(v.strip()) == 0:
            raise ValueError("Field names cannot be empty strings")
        return v


class Position(BaseModel):
    """Position and size configuration for dashboard components."""
    x: int = Field(..., ge=0, description="X coordinate (must be non-negative)")
    y: int = Field(..., ge=0, description="Y coordinate (must be non-negative)")
    width: int = Field(..., gt=0, description="Width (must be positive)")
    height: int = Field(..., gt=0, description="Height (must be positive)")

    @field_validator('width', 'height')
    @classmethod
    def validate_dimensions(cls, v):
        """Ensure dimensions are reasonable (not too large)."""
        if v > 12:  # Assuming 12-column grid system
            raise ValueError(f"Dimension {v} exceeds maximum grid size of 12")
        return v


class Styling(BaseModel):
    """Optional styling configuration for components."""
    colors: Optional[List[str]] = Field(None, description="Color palette for the component")
    borderRadius: Optional[int] = Field(None, ge=0, description="Border radius in pixels")
    padding: Optional[int] = Field(None, ge=0, description="Padding in pixels")
    fontSize: Optional[int] = Field(None, ge=8, le=72, description="Font size")
    backgroundColor: Optional[str] = Field(None, description="Background color")


class DashboardComponent(BaseModel):
    """
    Individual dashboard component specification.
    Implements FR-1: Component Model
    """
    id: str = Field(..., min_length=1, description="Unique component identifier")
    type: ComponentType = Field(..., description="Type of visualization component")
    title: str = Field(..., min_length=1, description="Display title for the component")
    dataMapping: DataMapping = Field(..., description="Configuration for data field mappings")
    position: Position = Field(..., description="Position and dimensions in grid layout")
    styling: Optional[Styling] = Field(None, description="Optional styling configuration")
    description: Optional[str] = Field(None, description="Optional component description")

    @field_validator('id')
    @classmethod
    def validate_id_format(cls, v):
        """Ensure ID follows valid format (alphanumeric with underscores/hyphens)."""
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("Component ID must contain only alphanumeric characters, underscores, or hyphens")
        return v


class LayoutConfig(BaseModel):
    """Grid layout configuration."""
    columns: int = Field(12, ge=1, le=24, description="Number of grid columns")
    rows: int = Field(..., ge=1, description="Number of grid rows")
    gap: int = Field(16, ge=0, description="Gap between components in pixels")
    padding: int = Field(16, ge=0, description="Container padding in pixels")


class ThemeSettings(BaseModel):
    """Theme configuration for dashboard."""
    primaryColor: str = Field("#3b82f6", description="Primary theme color")
    secondaryColor: str = Field("#a855f7", description="Secondary theme color")
    backgroundColor: str = Field("#18181b", description="Dashboard background color")
    textColor: str = Field("#f4f4f5", description="Default text color")
    fontFamily: str = Field("Inter, sans-serif", description="Font family")


class Metadata(BaseModel):
    """Dashboard metadata."""
    title: str = Field(..., min_length=1, description="Dashboard title")
    description: Optional[str] = Field(None, description="Dashboard description")
    apiEndpoint: str = Field(..., description="Source API endpoint URL")
    createdAt: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    dataSchema: Optional[Dict[str, str]] = Field(None, description="Data field types from API")
    refreshInterval: Optional[int] = Field(None, ge=0, description="Auto-refresh interval in seconds")


class DashboardSpec(BaseModel):
    """
    Complete dashboard specification.
    Implements FR-2: Dashboard Specification Model
    """
    components: List[DashboardComponent] = Field(..., min_length=1, description="List of dashboard components")
    layout: LayoutConfig = Field(..., description="Grid layout configuration")
    metadata: Metadata = Field(..., description="Dashboard metadata")
    theme: ThemeSettings = Field(default_factory=ThemeSettings, description="Theme settings")

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

    @model_validator(mode='after')
    def validate_component_positions(self):
        """
        Implements FR-3: Validation Rules - Ensure components fit within grid.
        """
        for comp in self.components:
            if comp.position.x + comp.position.width > self.layout.columns:
                raise ValueError(
                    f"Component '{comp.id}' extends beyond grid width: "
                    f"x({comp.position.x}) + width({comp.position.width}) > {self.layout.columns}"
                )
        return self

    @model_validator(mode='after')
    def validate_overlapping_components(self):
        """
        Implements FR-3: Validation Rules - Warn about overlapping components.
        """
        for i, comp1 in enumerate(self.components):
            for comp2 in self.components[i+1:]:
                # Check if rectangles overlap
                if not (comp1.position.x + comp1.position.width <= comp2.position.x or
                        comp2.position.x + comp2.position.width <= comp1.position.x or
                        comp1.position.y + comp1.position.height <= comp2.position.y or
                        comp2.position.y + comp2.position.height <= comp1.position.y):
                    # Overlapping detected - log warning but don't fail
                    print(f"Warning: Components '{comp1.id}' and '{comp2.id}' may overlap")
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
