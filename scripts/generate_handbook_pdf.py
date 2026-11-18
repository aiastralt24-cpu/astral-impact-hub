from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
SCREENSHOT_DIR = ROOT / "output" / "playwright"
PDF_PATH = OUTPUT_DIR / "astral-impact-hub-handbook.pdf"


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverKicker",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=colors.HexColor("#4F69FF"),
            leading=14,
            spaceAfter=10,
            alignment=TA_CENTER,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            textColor=colors.HexColor("#162033"),
            alignment=TA_CENTER,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#162033"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionKicker",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.HexColor("#4F69FF"),
            spaceAfter=6,
            alignment=TA_LEFT,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#42526B"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#42526B"),
            leftIndent=10,
            bulletIndent=0,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallMuted",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=12,
            textColor=colors.HexColor("#6E7B91"),
            alignment=TA_CENTER,
        )
    )
    return styles


def image_block(path: Path, width: float, max_height: float):
    img = Image(str(path))
    scale = min(width / img.imageWidth, max_height / img.imageHeight)
    img.drawWidth = img.imageWidth * scale
    img.drawHeight = img.imageHeight * scale
    return img


def bullet_list(items: list[str], styles):
    flow = []
    for item in items:
      flow.append(Paragraph(item, styles["BulletBody"], bulletText="•"))
    return flow


def make_screen_section(kicker: str, title: str, summary: str, bullets: list[str], screenshot: str, styles):
    path = SCREENSHOT_DIR / screenshot
    items = [
        Paragraph(kicker, styles["SectionKicker"]),
        Paragraph(title, styles["SectionTitle"]),
        Paragraph(summary, styles["Body"]),
        Spacer(1, 0.08 * inch),
    ]
    items.extend(bullet_list(bullets, styles))
    items.append(Spacer(1, 0.14 * inch))
    items.append(image_block(path, width=9.1 * inch, max_height=4.65 * inch))
    return items


def role_flow_table(styles):
    data = [
        [
            Paragraph("<b>Role</b>", styles["Body"]),
            Paragraph("<b>Primary responsibility</b>", styles["Body"]),
            Paragraph("<b>Typical flow</b>", styles["Body"]),
        ],
        [
            Paragraph("Super admin", styles["Body"]),
            Paragraph("Owns the full workspace, access control, projects, vendors, and oversight.", styles["Body"]),
            Paragraph("Login → review dashboard → create or assign users/vendors → manage projects → monitor updates, media, content, and publishing.", styles["Body"]),
        ],
        [
            Paragraph("Employee / project manager", styles["Body"]),
            Paragraph("Runs assigned projects and manages their vendor network.", styles["Body"]),
            Paragraph("Login → review assigned dashboard items → create vendors → manage scoped projects → review updates → push approved work toward content and distribution.", styles["Body"]),
        ],
        [
            Paragraph("Vendor", styles["Body"]),
            Paragraph("Submits field updates, media, and project progress only for own assignments.", styles["Body"]),
            Paragraph("Login → open assigned project → upload update details and media → respond to revision requests → resubmit for approval.", styles["Body"]),
        ],
    ]

    table = Table(data, colWidths=[1.5 * inch, 3.0 * inch, 5.2 * inch], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF0FF")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#23324D")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D6DEEF")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFF")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#6E7B91"))
    canvas.drawRightString(doc.pagesize[0] - 0.55 * inch, 0.35 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    styles = build_styles()

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=landscape((11.69 * inch, 8.27 * inch)),
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title="Astral Impact Hub Handbook",
        author="Codex",
    )

    story = [
        Spacer(1, 0.5 * inch),
        Paragraph("Astral Foundation", styles["CoverKicker"]),
        Paragraph("Astral Impact Hub Handbook", styles["CoverTitle"]),
        Paragraph(
            "Functional walkthrough, feature map, and user flows for the live operational platform.",
            styles["Body"],
        ),
        Spacer(1, 0.22 * inch),
        image_block(SCREENSHOT_DIR / "login.png", width=7.8 * inch, max_height=4.25 * inch),
        Spacer(1, 0.18 * inch),
        Paragraph(f"Prepared on {date.today().strftime('%B %d, %Y')}", styles["SmallMuted"]),
        PageBreak(),
        Paragraph("Purpose", styles["SectionKicker"]),
        Paragraph("What the platform is designed to do", styles["SectionTitle"]),
        Paragraph(
            "Astral Impact Hub turns scattered project activity into a structured operating system for foundation teams. "
            "It centralizes project records, scoped user access, field updates, media, approvals, content packaging, "
            "distribution, analytics, and workspace administration inside one controlled workflow.",
            styles["Body"],
        ),
        *bullet_list(
            [
                "Create and manage projects with ownership, geography, reporting cadence, and health context.",
                "Assign employees and vendors so every user only sees the projects and media inside their scope.",
                "Capture field updates through a guided seven-step submission flow built for structured storytelling.",
                "Review and approve incoming updates before generating content packages and sending them to channels.",
                "Maintain a single operational view across media, publishing status, delivery logs, analytics, and user access.",
            ],
            styles,
        ),
        Spacer(1, 0.18 * inch),
        role_flow_table(styles),
        PageBreak(),
    ]

    sections = [
        (
            "AUTHENTICATION",
            "Login and access entry",
            "The platform opens directly on the sign-in experience. Users authenticate with a role-linked workspace account before any project data becomes visible.",
            [
                "Supports controlled workspace entry through user ID and password.",
                "Separates super admin, employee, and vendor access paths behind the same secure front door.",
                "Keeps the interface minimal so users move straight into operations.",
            ],
            "login.png",
        ),
        (
            "DASHBOARD",
            "Operations overview",
            "The dashboard is the daily control room. It summarizes update timeliness, pending approvals, content readiness, and project health in one glance.",
            [
                "Top summary band shows immediate operating signals for leadership and managers.",
                "Secondary cards break out what needs review, revision, publishing, or urgent intervention.",
                "Project cards below help teams spot health issues and readiness at the portfolio level.",
            ],
            "dashboard.png",
        ),
        (
            "PROJECTS",
            "Project management",
            "Projects are the core operating units inside the hub. Each project stores descriptive context, geography, owners, reporting cadence, vendors, and status.",
            [
                "Super admin can create, edit, and delete projects.",
                "Employees can manage only projects inside their assigned scope.",
                "Project cards expose health, location, assigned vendor, and operational summary in one place.",
            ],
            "projects.png",
        ),
        (
            "UPDATES",
            "Field update engine",
            "The update module combines submission and review into one workspace. Vendors and employees can capture project activity, while reviewers keep queue and context visible beside the form.",
            [
                "Seven-step guided update flow covers project, narrative, impact data, story layer, media, flags, and review.",
                "Current context panel reduces mistakes by keeping the selected project visible while users submit.",
                "Designed to support revision loops instead of forcing users to restart from scratch.",
            ],
            "updates.png",
        ),
        (
            "VENDORS",
            "Vendor management",
            "The vendor module maintains implementation partners, contact details, service footprint, and project linkage. It also supports optional vendor login creation during onboarding.",
            [
                "Employees can onboard vendors for their own scope.",
                "Super admin and admins can edit and delete vendors when required.",
                "Vendor scoring and follow-up visibility help operational quality management.",
            ],
            "vendors.png",
        ),
        (
            "MEDIA",
            "Project-wise media library",
            "Media is organized around project context rather than as a loose gallery. This keeps visual evidence tied to the right project, vendor, and submission history.",
            [
                "Vendors only see media from their own assigned projects.",
                "Employees see media from the vendors and projects under their scope.",
                "Super admin can review the full media estate across the workspace.",
            ],
            "media.png",
        ),
        (
            "CONTENT",
            "Content packaging",
            "Approved updates can be turned into structured content packages for downstream channels. This creates a bridge between raw field reporting and publish-ready storytelling.",
            [
                "Eligible approved updates surface inside the content module.",
                "Generated packages can include emotional hook, captioning, and channel-specific messaging.",
                "The module keeps content generation attached to the underlying approved field update.",
            ],
            "content.png",
        ),
        (
            "DISTRIBUTION",
            "Channel distribution",
            "Once content is ready, the distribution module gives the team a controlled place to send updates to operational channels and track what has gone out.",
            [
                "Supports delivery actions against generated content packages.",
                "Shows recent delivery activity and operational send status.",
                "Helps managers separate ready-to-send work from already delivered communication.",
            ],
            "distribution.png",
        ),
        (
            "ANALYTICS",
            "Workspace analytics",
            "Analytics consolidates performance signals from projects, vendors, updates, and channel deliveries so the team can move from reactive operations to measurable management.",
            [
                "Combines headline metrics with project-level operational status.",
                "Creates a leadership-friendly summary for quick reviews.",
                "Provides a foundation for tracking update quality, readiness, and distribution outcomes over time.",
            ],
            "analytics.png",
        ),
        (
            "SETTINGS",
            "Access control and user administration",
            "Settings is where the super admin governs the workspace itself. It supports employee and vendor account creation, role assignment, and future access edits.",
            [
                "Super admin can create, edit, and delete employees, vendors, and access mappings.",
                "Employees can create vendors but cannot create other employees.",
                "The module reinforces the rule that only super admin has full workspace visibility.",
            ],
            "settings.png",
        ),
    ]

    for index, (kicker, title, summary, bullets, screenshot) in enumerate(sections):
        story.extend(make_screen_section(kicker, title, summary, bullets, screenshot, styles))
        if index != len(sections) - 1:
            story.append(PageBreak())

    story.extend(
        [
            PageBreak(),
            Paragraph("USER FLOWS", styles["SectionKicker"]),
            Paragraph("Suggested operational journeys", styles["SectionTitle"]),
            Paragraph(
                "The hub is most effective when each role stays inside its intended path. The flows below show how the product is meant to be used in day-to-day operations.",
                styles["Body"],
            ),
            Spacer(1, 0.08 * inch),
            KeepTogether(
                [
                    Paragraph("<b>1. Super admin setup flow</b>", styles["Body"]),
                    *bullet_list(
                        [
                            "Sign in and review the dashboard for overall health and pending work.",
                            "Create or update employee accounts and choose whether a new user is an employee or vendor.",
                            "Create projects, assign owners, connect vendors, and set review expectations.",
                            "Monitor updates, approvals, content generation, publishing, and analytics across the full workspace.",
                        ],
                        styles,
                    ),
                ]
            ),
            Spacer(1, 0.1 * inch),
            KeepTogether(
                [
                    Paragraph("<b>2. Employee / project manager flow</b>", styles["Body"]),
                    *bullet_list(
                        [
                            "Sign in and view only the assigned projects, vendors, media, and updates.",
                            "Create vendors when needed and attach them to the correct project scope.",
                            "Review field updates, request revisions when needed, and move strong submissions toward approval.",
                            "Use content, distribution, and analytics to close the loop on operational storytelling.",
                        ],
                        styles,
                    ),
                ]
            ),
            Spacer(1, 0.1 * inch),
            KeepTogether(
                [
                    Paragraph("<b>3. Vendor submission flow</b>", styles["Body"]),
                    *bullet_list(
                        [
                            "Sign in and access only the assigned project workspace.",
                            "Open the update module and complete the seven-step submission flow.",
                            "Upload media tied to that project only.",
                            "Respond to revisions, resubmit, and maintain a clear project history for the internal team.",
                        ],
                        styles,
                    ),
                ]
            ),
            Spacer(1, 0.18 * inch),
            Paragraph("Feature checklist", styles["SectionKicker"]),
            Paragraph("What is already covered in the live portal", styles["SectionTitle"]),
            *bullet_list(
                [
                    "Secure login and role-based workspace access",
                    "Project creation, editing, and scoped visibility",
                    "Employee and vendor account administration",
                    "Vendor onboarding with optional login creation",
                    "Project-wise media visibility",
                    "Seven-step field update workflow",
                    "Approval and revision-ready update workspace",
                    "Content generation handoff area",
                    "Distribution management and delivery visibility",
                    "Analytics and leadership summary surfaces",
                ],
                styles,
            ),
        ]
    )

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)


if __name__ == "__main__":
    build_pdf()
