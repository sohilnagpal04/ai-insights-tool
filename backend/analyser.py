import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest


def analyse_csv(df: pd.DataFrame):
    summary = {
        "row_count": int(df.shape[0]),
        "column_count": int(df.shape[1]),
        "columns": list(df.columns),
        "missing_values": {k: int(v) for k, v in df.isnull().sum().items() if v > 0},
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
    }

    numeric_df = df.select_dtypes(include="number")
    if not numeric_df.empty:
        desc = numeric_df.describe().round(3)
        summary["numeric_summary"] = desc.to_dict()

        if numeric_df.shape[1] > 1:
            corr = numeric_df.corr().abs()
            upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
            top_corr = upper.stack().sort_values(ascending=False).head(3)
            summary["top_correlations"] = [
                {"columns": f"{a} & {b}", "correlation": round(float(v), 3)}
                for (a, b), v in top_corr.items()
            ]

    cat_df = df.select_dtypes(include="object")
    cat_summary = {}
    for col in cat_df.columns[:5]:
        top = df[col].value_counts().head(5).to_dict()
        cat_summary[col] = {str(k): int(v) for k, v in top.items()}
    if cat_summary:
        summary["categorical_summary"] = cat_summary

    numeric_clean = numeric_df.dropna()
    if not numeric_clean.empty and len(numeric_clean) >= 10:
        model = IsolationForest(contamination=0.05, random_state=42)
        labels = model.fit_predict(numeric_clean)
        anomaly_indices = numeric_clean.index[labels == -1].tolist()
        anomaly_rows = df.loc[anomaly_indices].head(5)
        summary["anomaly_count"] = len(anomaly_indices)
        summary["anomaly_sample"] = [
            {k: (None if pd.isna(v) else v) for k, v in row.items()}
            for row in anomaly_rows.to_dict(orient="records")
        ]
    else:
        summary["anomaly_count"] = 0
        summary["anomaly_sample"] = []

    return summary


def get_charts(df: pd.DataFrame) -> dict:
    charts = {}
    numeric_cols = df.select_dtypes(include="number").columns[:4]
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        counts, edges = np.histogram(series, bins=20)
        charts[col] = [
            {"label": f"{e:.1f}", "value": int(c)}
            for e, c in zip(edges[:-1], counts)
        ]
    return charts
