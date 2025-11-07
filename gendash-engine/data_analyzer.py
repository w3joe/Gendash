"""
Data analysis and heuristics layer for dashboard generation.
Implements FR-8, FR-9, and FR-10 from requirements.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
import re
from schemas import DataAnalysisResult


class DataAnalyzer:
    """
    Analyzes API data to extract insights for dashboard generation.
    Implements FR-8: API Data Analysis
    """

    def __init__(self, data: List[Dict[str, Any]]):
        """
        Initialize analyzer with API data.

        Args:
            data: List of dictionaries representing API response data
        """
        self.data = data
        self.df = pd.DataFrame(data) if data else pd.DataFrame()

    def analyze(self) -> DataAnalysisResult:
        """
        Perform comprehensive data analysis.

        Returns:
            DataAnalysisResult with all analysis findings
        """
        if self.df.empty:
            return DataAnalysisResult(
                dataTypes={},
                isTimeSeries=False,
                recommendedCharts=["metric"]
            )

        data_types = self._detect_data_types()
        time_fields = self._detect_time_fields()
        numeric_fields = self._detect_numeric_fields()
        categorical_fields = self._detect_categorical_fields()
        key_metrics = self._identify_key_metrics(numeric_fields)
        cardinality = self._calculate_cardinality()
        null_percentages = self._calculate_null_percentages()
        recommended_charts = self._recommend_chart_types(
            time_fields, numeric_fields, categorical_fields, cardinality
        )

        return DataAnalysisResult(
            dataTypes=data_types,
            isTimeSeries=len(time_fields) > 0,
            timeFields=time_fields,
            numericFields=numeric_fields,
            categoricalFields=categorical_fields,
            keyMetrics=key_metrics,
            cardinality=cardinality,
            nullPercentages=null_percentages,
            recommendedCharts=recommended_charts,
            sampleData=self.data[:10]  # First 10 rows
        )

    def _detect_data_types(self) -> Dict[str, str]:
        """Detect data types for each field."""
        type_mapping = {}
        for col in self.df.columns:
            dtype = self.df[col].dtype
            if pd.api.types.is_numeric_dtype(dtype):
                if pd.api.types.is_integer_dtype(dtype):
                    type_mapping[col] = "integer"
                else:
                    type_mapping[col] = "float"
            elif pd.api.types.is_datetime64_any_dtype(dtype):
                type_mapping[col] = "datetime"
            elif pd.api.types.is_bool_dtype(dtype):
                type_mapping[col] = "boolean"
            else:
                # Try to parse as datetime
                if self._is_datetime_field(col):
                    type_mapping[col] = "datetime"
                else:
                    type_mapping[col] = "string"
        return type_mapping

    def _is_datetime_field(self, column: str) -> bool:
        """Check if a string column contains datetime values."""
        sample = self.df[column].dropna().head(10)
        if len(sample) == 0:
            return False

        # Common date patterns
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
            r'\d{4}/\d{2}/\d{2}',  # YYYY/MM/DD
        ]

        # Check field name hints
        name_hints = ['date', 'time', 'timestamp', 'created', 'updated', 'at', 'on']
        has_name_hint = any(hint in column.lower() for hint in name_hints)

        # Try parsing sample values
        try:
            pd.to_datetime(sample, errors='coerce')
            parsed = pd.to_datetime(sample, errors='coerce')
            valid_dates = parsed.notna().sum()
            if valid_dates / len(sample) > 0.8:  # 80% parseable
                return True
        except:
            pass

        # Check pattern matching
        if has_name_hint:
            return True

        return False

    def _detect_time_fields(self) -> List[str]:
        """
        Implements FR-9: TimeSeriesDetector tool.
        Detect fields containing time/date information.
        """
        time_fields = []
        for col in self.df.columns:
            if pd.api.types.is_datetime64_any_dtype(self.df[col]):
                time_fields.append(col)
            elif self._is_datetime_field(col):
                time_fields.append(col)
        return time_fields

    def _detect_numeric_fields(self) -> List[str]:
        """Identify numeric fields suitable for quantitative visualization."""
        numeric_fields = []
        for col in self.df.columns:
            if pd.api.types.is_numeric_dtype(self.df[col]):
                # Exclude fields that might be IDs
                if not self._is_id_field(col):
                    numeric_fields.append(col)
        return numeric_fields

    def _detect_categorical_fields(self) -> List[str]:
        """Identify categorical fields suitable for grouping/segmentation."""
        categorical_fields = []
        for col in self.df.columns:
            if not pd.api.types.is_numeric_dtype(self.df[col]):
                unique_count = self.df[col].nunique()
                total_count = len(self.df[col])

                # Consider categorical if unique ratio is reasonable
                if unique_count < total_count * 0.5 and unique_count < 50:
                    categorical_fields.append(col)
        return categorical_fields

    def _is_id_field(self, column: str) -> bool:
        """Check if a field is likely an ID field."""
        id_hints = ['id', 'key', 'index', 'no', 'number', 'code']
        if any(hint in column.lower() for hint in id_hints):
            # Check if values are sequential or unique
            if self.df[column].is_unique or self.df[column].is_monotonic_increasing:
                return True
        return False

    def _identify_key_metrics(self, numeric_fields: List[str]) -> List[str]:
        """
        Implements FR-9: MetricCalculator tool.
        Identify potential KPIs and key metrics.
        """
        key_metrics = []
        metric_keywords = [
            'total', 'sum', 'count', 'average', 'avg', 'mean',
            'revenue', 'sales', 'profit', 'cost', 'price',
            'amount', 'value', 'rate', 'percentage', 'score',
            'balance', 'budget', 'spend', 'earning'
        ]

        for field in numeric_fields:
            field_lower = field.lower()
            if any(keyword in field_lower for keyword in metric_keywords):
                key_metrics.append(field)

        # If no keyword matches, use fields with highest variance
        if not key_metrics and len(numeric_fields) > 0:
            variances = {field: self.df[field].var() for field in numeric_fields}
            sorted_fields = sorted(variances.items(), key=lambda x: x[1], reverse=True)
            key_metrics = [field for field, _ in sorted_fields[:3]]  # Top 3

        return key_metrics

    def _calculate_cardinality(self) -> Dict[str, int]:
        """Calculate unique value counts for each field."""
        return {col: int(self.df[col].nunique()) for col in self.df.columns}

    def _calculate_null_percentages(self) -> Dict[str, float]:
        """Calculate null/missing value percentages."""
        null_counts = self.df.isnull().sum()
        total_counts = len(self.df)
        return {
            col: round(float(null_counts[col] / total_counts * 100), 2)
            for col in self.df.columns
        }

    def _recommend_chart_types(
        self,
        time_fields: List[str],
        numeric_fields: List[str],
        categorical_fields: List[str],
        cardinality: Dict[str, int]
    ) -> List[str]:
        """
        Implements FR-9: ChartTypeRecommender tool.
        Suggest appropriate visualization types based on data characteristics.
        """
        recommendations = []

        # Time series data -> line or area charts
        if time_fields and numeric_fields:
            recommendations.extend(["line", "area"])

        # Categorical + numeric -> bar charts
        if categorical_fields and numeric_fields:
            # Check cardinality
            low_cardinality_cats = [
                cat for cat in categorical_fields
                if cardinality.get(cat, float('inf')) <= 10
            ]
            if low_cardinality_cats:
                recommendations.append("bar")
                recommendations.append("pie")

        # Multiple numeric fields -> scatter, multi-line
        if len(numeric_fields) >= 2:
            recommendations.append("scatter")

        # Always recommend metrics for key statistics
        recommendations.append("metric")

        # Tabular view for detailed data
        recommendations.append("table")

        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recommendations.append(rec)

        return unique_recommendations


class RelationshipMapper:
    """
    Implements FR-9: RelationshipMapper tool.
    Finds relationships and foreign key patterns in data.
    """

    @staticmethod
    def find_relationships(df: pd.DataFrame) -> Dict[str, List[str]]:
        """
        Identify potential relationships between fields.

        Returns:
            Dictionary mapping field names to related fields
        """
        relationships = {}

        # Look for ID fields that might be foreign keys
        id_fields = [col for col in df.columns if 'id' in col.lower()]

        for id_field in id_fields:
            related = []
            # Find fields that might be related (same prefix before _id)
            prefix = id_field.replace('_id', '').replace('Id', '').replace('ID', '')

            for col in df.columns:
                if col != id_field and prefix.lower() in col.lower():
                    related.append(col)

            if related:
                relationships[id_field] = related

        return relationships
