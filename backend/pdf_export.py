import io
import json
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ── Colour palette (matches the dark UI accent colours) ──────────────────
PAGE_W = A4[0] - 36 * mm  # usable width (A4 minus 18mm margins each side)

CYAN   = colors.HexColor("#06b6d4")
SLATE  = colors.HexColor("#334155")
LIGHT  = colors.HexColor("#f1f5f9")
WHITE  = colors.white
AMBER  = colors.HexColor("#f59e0b")
VIOLET = colors.HexColor("#8b5cf6")
DARK   = colors.HexColor("#0f172a")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", fontSize=22, textColor=DARK,
                                 leading=28, spaceAfter=0, fontName="Helvetica-Bold"),
        "subtitle": ParagraphStyle("subtitle", fontSize=11, textColor=SLATE,
                                    leading=14, spaceAfter=0, fontName="Helvetica"),
        "section": ParagraphStyle("section", fontSize=13, textColor=DARK,
                                   spaceBefore=14, spaceAfter=6,
                                   fontName="Helvetica-Bold"),
        "body": ParagraphStyle("body", fontSize=10, textColor=SLATE,
                                leading=15, spaceAfter=4, fontName="Helvetica"),
        "label": ParagraphStyle("label", fontSize=8, textColor=colors.HexColor("#94a3b8"),
                                 fontName="Helvetica-Bold", spaceAfter=2),
        "insight_title": ParagraphStyle("insight_title", fontSize=10, textColor=DARK,
                                         fontName="Helvetica-Bold", spaceAfter=2),
    }


def _stat_table(stats: list[tuple[str, str]]) -> Table:
    """Render a row of stat chips: [(label, value), ...]"""
    data = [[v for _, v in stats], [l for l, _ in stats]]
    col_w = PAGE_W / len(stats)
    t = Table(data, colWidths=[col_w] * len(stats))
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), CYAN),
        ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 16),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS",(0, 1), (-1, 1), [LIGHT]),
        ("TEXTCOLOR",     (0, 1), (-1, 1), SLATE),
        ("FONTSIZE",      (0, 1), (-1, 1), 8),
        ("FONTNAME",      (0, 1), (-1, 1), "Helvetica"),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    return t


def _numeric_table(numeric_summary: dict, styles) -> Table:
    stats = ["mean", "std", "min", "50%", "max"]
    cols  = list((numeric_summary.get("mean") or {}).keys())
    if not cols:
        return Paragraph("No numeric columns.", styles["body"])

    header = ["Column"] + [s.upper() for s in stats]
    rows   = [header]
    for col in cols:
        row = [col]
        for s in stats:
            v = (numeric_summary.get(s) or {}).get(col)
            row.append(f"{v:.2f}" if v is not None else "—")
        rows.append(row)

    stat_col_w = (PAGE_W - 55 * mm) / len(stats)
    col_w = [55 * mm] + [stat_col_w] * len(stats)
    t = Table(rows, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 8),
        ("ALIGN",         (1, 0), (-1, -1), "RIGHT"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT]),
        ("TEXTCOLOR",     (0, 1), (-1, -1), SLATE),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def _anomaly_table(samples: list[dict], styles) -> Table:
    if not samples:
        return Paragraph("No sample rows available.", styles["body"])
    cols = list(samples[0].keys())
    col_w = PAGE_W / len(cols)
    hdr_style  = ParagraphStyle("ah", fontSize=7, textColor=DARK,
                                 fontName="Helvetica-Bold", leading=9)
    cell_style = ParagraphStyle("ac", fontSize=7, textColor=SLATE,
                                 fontName="Helvetica", leading=9)
    header = [Paragraph(c, hdr_style) for c in cols]
    rows = [header] + [
        [Paragraph(str(r.get(c, "—")), cell_style) for c in cols]
        for r in samples
    ]
    t = Table(rows, colWidths=[col_w] * len(cols))
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), AMBER),
        ("FONTSIZE",      (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, colors.HexColor("#fffbeb")]),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#fde68a")),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def generate_pdf(filename: str, summary: dict, insights: dict | None) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
    )
    S = _styles()
    story = []

    # ── Header ────────────────────────────────────────────────────────────
    header_table = Table(
        [
            [Paragraph("AI Insights Report", S["title"])],
            [Paragraph(f"Dataset: <b>{filename}</b>", S["subtitle"])],
            [Paragraph(f"Generated: {datetime.now().strftime('%d %B %Y, %H:%M')}", S["subtitle"])],
        ],
        colWidths=[PAGE_W],
        rowHeights=[36, 18, 18],
    )
    header_table.setStyle(TableStyle([
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("VALIGN",        (0, 0), (-1, -1), "BOTTOM"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=CYAN, spaceAfter=10))

    # ── Stat chips ────────────────────────────────────────────────────────
    missing_total = sum(summary.get("missing_values", {}).values())
    story.append(_stat_table([
        ("Rows",           str(summary.get("row_count", "—"))),
        ("Columns",        str(summary.get("column_count", "—"))),
        ("Anomalies",      str(summary.get("anomaly_count", 0))),
        ("Missing Values", str(missing_total)),
    ]))
    story.append(Spacer(1, 10))

    # ── AI Insights ───────────────────────────────────────────────────────
    if insights:
        story.append(Paragraph("AI-Generated Insights", S["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=SLATE, spaceAfter=6))

        if insights.get("executive_summary"):
            story.append(Paragraph("Executive Summary", S["label"]))
            story.append(Paragraph(insights["executive_summary"], S["body"]))
            story.append(Spacer(1, 6))

        if insights.get("insights"):
            story.append(Paragraph("Key Insights", S["label"]))
            for ins in insights["insights"]:
                story.append(Paragraph(f"• <b>{ins['title']}</b>: {ins['detail']}", S["body"]))
            story.append(Spacer(1, 6))

        if insights.get("recommendation"):
            story.append(Paragraph("Recommendation", S["label"]))
            # Cyan highlight box via a 1-cell table
            rec_table = Table(
                [[Paragraph(insights["recommendation"], ParagraphStyle(
                    "rec", fontSize=10, textColor=DARK, leading=15, fontName="Helvetica"
                ))]],
                colWidths=[A4[0] - 36 * mm]
            )
            rec_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ecfeff")),
                ("BOX",        (0, 0), (-1, -1), 1.5, CYAN),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING",  (0, 0), (-1, -1), 10),
            ]))
            story.append(rec_table)
            story.append(Spacer(1, 6))

        if insights.get("anomalies"):
            story.append(Paragraph("Anomaly Analysis", S["label"]))
            anom_table = Table(
                [[Paragraph(insights["anomalies"], ParagraphStyle(
                    "anom", fontSize=10, textColor=DARK, leading=15, fontName="Helvetica"
                ))]],
                colWidths=[A4[0] - 36 * mm]
            )
            anom_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
                ("BOX",        (0, 0), (-1, -1), 1.5, AMBER),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING",  (0, 0), (-1, -1), 10),
            ]))
            story.append(anom_table)

    # ── Numeric Summary ───────────────────────────────────────────────────
    if summary.get("numeric_summary"):
        story.append(Paragraph("Numeric Summary", S["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=SLATE, spaceAfter=6))
        story.append(_numeric_table(summary["numeric_summary"], S))

    # ── Correlations ──────────────────────────────────────────────────────
    if summary.get("top_correlations"):
        story.append(Paragraph("Top Correlations", S["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=SLATE, spaceAfter=6))
        corr_data = [["Column Pair", "Correlation"]] + [
            [c["columns"], f"{c['correlation']:.3f}"]
            for c in summary["top_correlations"]
        ]
        t = Table(corr_data, colWidths=[PAGE_W - 44 * mm, 44 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
            ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE",      (0, 0), (-1, -1), 9),
            ("ALIGN",         (1, 0), (-1, -1), "CENTER"),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT]),
            ("TEXTCOLOR",     (0, 1), (-1, -1), SLATE),
            ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)

    # ── Anomaly sample rows ───────────────────────────────────────────────
    anomaly_samples = summary.get("anomaly_sample", [])
    if anomaly_samples:
        story.append(Paragraph("Anomalous Row Samples", S["section"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=AMBER, spaceAfter=6))
        story.append(Paragraph(
            f"{summary.get('anomaly_count', 0)} anomalous rows detected (showing first 5).",
            S["body"]
        ))
        story.append(_anomaly_table(anomaly_samples, S))

    # ── Footer ────────────────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0")))
    story.append(Paragraph(
        "Generated by <b>AI Insights Tool</b> — sohilnagpal.com",
        ParagraphStyle("footer", fontSize=8, textColor=colors.HexColor("#94a3b8"),
                       alignment=TA_CENTER, spaceBefore=4)
    ))

    doc.build(story)
    return buf.getvalue()
