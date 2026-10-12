"""
BizOS AI — Data Analysis Service
Handles CSV/Excel file parsing with pandas for Revenue and Finance agents.
"""

import io
import pandas as pd
from typing import Optional


def parse_data_file(file_bytes: bytes, filename: str) -> Optional[str]:
    """
    Parse CSV or Excel file and return a text summary for agent context.
    """
    try:
        file_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if file_ext == "csv":
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif file_ext in ("xlsx", "xls"):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            return None

        # Generate a comprehensive summary
        summary_parts = []

        # Basic info
        summary_parts.append(f"Dataset: {filename}")
        summary_parts.append(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
        summary_parts.append(f"Columns: {', '.join(df.columns.tolist())}")

        # Data types
        summary_parts.append(f"\nColumn Types:\n{df.dtypes.to_string()}")

        # Numeric statistics
        numeric_cols = df.select_dtypes(include=["number"]).columns
        if len(numeric_cols) > 0:
            summary_parts.append(f"\nNumeric Statistics:\n{df[numeric_cols].describe().to_string()}")

            # Totals for numeric columns
            totals = df[numeric_cols].sum()
            summary_parts.append(f"\nColumn Totals:\n{totals.to_string()}")

        # Date columns detection and range
        for col in df.columns:
            if "date" in col.lower() or "time" in col.lower():
                try:
                    dates = pd.to_datetime(df[col], errors="coerce")
                    valid_dates = dates.dropna()
                    if len(valid_dates) > 0:
                        summary_parts.append(
                            f"\nDate Range ({col}): {valid_dates.min()} to {valid_dates.max()}"
                        )
                except Exception:
                    pass

        # Category distributions
        cat_cols = df.select_dtypes(include=["object"]).columns
        for col in cat_cols[:5]:  # Limit to first 5 categorical columns
            value_counts = df[col].value_counts().head(10)
            summary_parts.append(f"\nTop values for '{col}':\n{value_counts.to_string()}")

        # First few rows as sample
        summary_parts.append(f"\nSample Data (first 5 rows):\n{df.head().to_string()}")

        return "\n".join(summary_parts)

    except Exception as e:
        return f"Error parsing file: {str(e)}"
