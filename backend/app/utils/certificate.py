import os
from datetime import datetime, timezone
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from flask import current_app
from .helpers import generate_certificate_number


def generate_certificate(user, course, cert_number: str) -> str:
    """Generate a PDF certificate and return the relative file path."""
    cert_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "certificates")
    os.makedirs(cert_dir, exist_ok=True)
    filename = f"{cert_number}.pdf"
    filepath = os.path.join(cert_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=landscape(A4),
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()
    gold = colors.HexColor("#C9A84C")
    dark = colors.HexColor("#1a1a2e")

    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Title"],
        fontSize=36,
        textColor=gold,
        alignment=TA_CENTER,
        spaceAfter=12,
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "CertSubtitle",
        parent=styles["Normal"],
        fontSize=16,
        textColor=dark,
        alignment=TA_CENTER,
        spaceAfter=8,
    )
    name_style = ParagraphStyle(
        "CertName",
        parent=styles["Normal"],
        fontSize=28,
        textColor=dark,
        alignment=TA_CENTER,
        spaceAfter=12,
        fontName="Helvetica-Bold",
    )
    body_style = ParagraphStyle(
        "CertBody",
        parent=styles["Normal"],
        fontSize=14,
        textColor=dark,
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    small_style = ParagraphStyle(
        "CertSmall",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.grey,
        alignment=TA_CENTER,
    )

    issued = datetime.now(timezone.utc).strftime("%B %d, %Y")
    full_name = f"{user.first_name} {user.last_name}"

    story = [
        Spacer(1, 0.3 * inch),
        Paragraph("CERTIFICATE OF COMPLETION", title_style),
        Paragraph("This is to certify that", subtitle_style),
        Spacer(1, 0.15 * inch),
        Paragraph(full_name, name_style),
        Spacer(1, 0.1 * inch),
        Paragraph("has successfully completed the course", body_style),
        Spacer(1, 0.1 * inch),
        Paragraph(f'<b>"{course.title}"</b>', name_style),
        Spacer(1, 0.2 * inch),
        Paragraph(f"Issued on: {issued}", body_style),
        Spacer(1, 0.1 * inch),
        Paragraph(f"Certificate No: {cert_number}", small_style),
    ]

    doc.build(story)
    return os.path.join("certificates", filename).replace("\\", "/")
