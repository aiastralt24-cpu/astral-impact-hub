from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Astral_Impact_Hub_User_Handbook.docx"
LOGO = ROOT / "public/brand/astral-foundation-logo.jpg"

INK = "17233C"
BLUE = "0059FF"
PALE = "EAF1FF"
GRAY = "667085"
LIGHT = "F5F7FB"
GREEN = "137A50"
AMBER = "946200"
RED = "B42318"

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Inches(8.5), Inches(11)
sec.top_margin = sec.bottom_margin = Inches(0.78)
sec.left_margin = sec.right_margin = Inches(0.82)
sec.header_distance, sec.footer_distance = Inches(0.35), Inches(0.35)

styles = doc.styles
normal = styles["Normal"]
normal.font.name, normal.font.size, normal.font.color.rgb = "Aptos", Pt(10.5), RGBColor.from_string(INK)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.18
for name, size, before, after, color in [
    ("Title", 30, 0, 10, INK), ("Subtitle", 14, 0, 12, GRAY),
    ("Heading 1", 19, 18, 8, BLUE), ("Heading 2", 14, 13, 6, INK),
    ("Heading 3", 11.5, 10, 4, BLUE)]:
    st = styles[name]
    st.font.name, st.font.size = "Aptos Display", Pt(size)
    st.font.bold = name != "Subtitle"
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.space_before, st.paragraph_format.space_after = Pt(before), Pt(after)
    st.paragraph_format.keep_with_next = True

for list_name in ["List Bullet", "List Number"]:
    st = styles[list_name]
    st.font.name, st.font.size = "Aptos", Pt(10.5)
    st.paragraph_format.left_indent = Inches(0.32)
    st.paragraph_format.first_line_indent = Inches(-0.18)
    st.paragraph_format.space_after = Pt(4)
    st.paragraph_format.line_spacing = 1.16

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd"); tcPr.append(shd)
    shd.set(qn("w:fill"), fill)

def set_cell_margins(cell, top=90, start=120, bottom=90, end=120):
    tc = cell._tc; tcPr = tc.get_or_add_tcPr(); tcMar = tcPr.first_child_found_in("w:tcMar")
    if tcMar is None:
        tcMar = OxmlElement("w:tcMar"); tcPr.append(tcMar)
    for m, v in (("top",top),("start",start),("bottom",bottom),("end",end)):
        node = tcMar.find(qn(f"w:{m}"))
        if node is None: node = OxmlElement(f"w:{m}"); tcMar.append(node)
        node.set(qn("w:w"), str(v)); node.set(qn("w:type"), "dxa")

def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr(); tblHeader = OxmlElement("w:tblHeader"); tblHeader.set(qn("w:val"), "true"); trPr.append(tblHeader)

def field(run, code):
    begin=OxmlElement("w:fldChar"); begin.set(qn("w:fldCharType"),"begin")
    instr=OxmlElement("w:instrText"); instr.set(qn("xml:space"),"preserve"); instr.text=code
    end=OxmlElement("w:fldChar"); end.set(qn("w:fldCharType"),"end")
    run._r.extend([begin,instr,end])

header = sec.header.paragraphs[0]
header.text = "ASTRAL IMPACT HUB  •  USER HANDBOOK"
header.style = styles["Caption"]
header.runs[0].font.name="Aptos"; header.runs[0].font.size=Pt(8); header.runs[0].font.bold=True; header.runs[0].font.color.rgb=RGBColor.from_string(GRAY)
footer = sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
r=footer.add_run("User Handbook  |  Page "); r.font.size=Pt(8); r.font.color.rgb=RGBColor.from_string(GRAY); field(footer.add_run(), "PAGE")

def add_kicker(text):
    p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(6)
    r=p.add_run(text.upper()); r.bold=True; r.font.name="Aptos"; r.font.size=Pt(9); r.font.color.rgb=RGBColor.from_string(BLUE)

def add_callout(title, text, fill=PALE, accent=BLUE):
    t=doc.add_table(rows=1, cols=1); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False; t.columns[0].width=Inches(6.65)
    c=t.cell(0,0); c.width=Inches(6.65); shade(c,fill); set_cell_margins(c,150,180,150,180)
    p=c.paragraphs[0]; p.paragraph_format.space_after=Pt(3)
    rr=p.add_run(title+"  "); rr.bold=True; rr.font.color.rgb=RGBColor.from_string(accent)
    p.add_run(text)
    doc.add_paragraph().paragraph_format.space_after=Pt(0)

def add_bullets(items):
    for item in items: doc.add_paragraph(item, style="List Bullet")

def new_decimal_num_id():
    numbering = doc.part.numbering_part.element
    abstract_ids = [int(x.get(qn("w:abstractNumId"))) for x in numbering.findall(qn("w:abstractNum"))]
    num_ids = [int(x.get(qn("w:numId"))) for x in numbering.findall(qn("w:num"))]
    abstract_id = max(abstract_ids or [0]) + 1
    num_id = max(num_ids or [0]) + 1
    abstract = OxmlElement("w:abstractNum"); abstract.set(qn("w:abstractNumId"), str(abstract_id))
    multi = OxmlElement("w:multiLevelType"); multi.set(qn("w:val"), "singleLevel"); abstract.append(multi)
    lvl = OxmlElement("w:lvl"); lvl.set(qn("w:ilvl"), "0")
    start = OxmlElement("w:start"); start.set(qn("w:val"), "1"); lvl.append(start)
    fmt = OxmlElement("w:numFmt"); fmt.set(qn("w:val"), "decimal"); lvl.append(fmt)
    txt = OxmlElement("w:lvlText"); txt.set(qn("w:val"), "%1."); lvl.append(txt)
    suff = OxmlElement("w:suff"); suff.set(qn("w:val"), "tab"); lvl.append(suff)
    ppr = OxmlElement("w:pPr")
    tabs = OxmlElement("w:tabs"); tab = OxmlElement("w:tab"); tab.set(qn("w:val"), "num"); tab.set(qn("w:pos"), "540"); tabs.append(tab); ppr.append(tabs)
    ind = OxmlElement("w:ind"); ind.set(qn("w:left"), "540"); ind.set(qn("w:hanging"), "270"); ppr.append(ind); lvl.append(ppr)
    rpr = OxmlElement("w:rPr"); fonts = OxmlElement("w:rFonts"); fonts.set(qn("w:ascii"), "Aptos"); fonts.set(qn("w:hAnsi"), "Aptos"); rpr.append(fonts); lvl.append(rpr)
    abstract.append(lvl); numbering.append(abstract)
    num = OxmlElement("w:num"); num.set(qn("w:numId"), str(num_id)); abstract_ref = OxmlElement("w:abstractNumId"); abstract_ref.set(qn("w:val"), str(abstract_id)); num.append(abstract_ref); numbering.append(num)
    return num_id

def add_steps(items):
    num_id = new_decimal_num_id()
    for title, detail in items:
        p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(4); p.paragraph_format.line_spacing=1.16
        ppr=p._p.get_or_add_pPr(); numPr=OxmlElement("w:numPr"); ilvl=OxmlElement("w:ilvl"); ilvl.set(qn("w:val"),"0"); numId=OxmlElement("w:numId"); numId.set(qn("w:val"),str(num_id)); numPr.extend([ilvl,numId]); ppr.append(numPr)
        r=p.add_run(title+" — "); r.bold=True; p.add_run(detail)

def add_table(headers, rows, widths=None):
    t=doc.add_table(rows=1, cols=len(headers)); t.style="Table Grid"; t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
    if widths is None: widths=[6.5/len(headers)]*len(headers)
    for i,(h,w) in enumerate(zip(headers,widths)):
        t.columns[i].width=Inches(w); c=t.cell(0,i); c.width=Inches(w); shade(c,INK); set_cell_margins(c)
        p=c.paragraphs[0]; p.paragraph_format.space_after=Pt(0); rr=p.add_run(h); rr.bold=True; rr.font.color.rgb=RGBColor(255,255,255); rr.font.size=Pt(9)
    set_repeat_table_header(t.rows[0])
    for ri,row in enumerate(rows):
        cells=t.add_row().cells
        for i,(val,w) in enumerate(zip(row,widths)):
            cells[i].width=Inches(w); cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER; set_cell_margins(cells[i])
            if ri%2: shade(cells[i],LIGHT)
            p=cells[i].paragraphs[0]; p.paragraph_format.space_after=Pt(0); p.add_run(str(val)).font.size=Pt(9)
    doc.add_paragraph().paragraph_format.space_after=Pt(0)

def chapter(title, subtitle=None):
    doc.add_page_break(); add_kicker("Astral Impact Hub")
    doc.add_heading(title, level=1)
    if subtitle:
        p=doc.add_paragraph(subtitle); p.paragraph_format.space_after=Pt(12); p.runs[0].font.color.rgb=RGBColor.from_string(GRAY)

# Cover
doc.add_paragraph().paragraph_format.space_after=Pt(38)
if LOGO.exists():
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run().add_picture(str(LOGO), width=Inches(1.25))
doc.add_paragraph().paragraph_format.space_after=Pt(38)
add_kicker("Official user guide • Version 1.0")
p=doc.add_paragraph("Astral Impact Hub", style="Title"); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p=doc.add_paragraph("Complete User Handbook", style="Subtitle"); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p=doc.add_paragraph("Projects • Field updates • Approvals • Media • Content • Distribution • Analytics", style="Subtitle"); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph().paragraph_format.space_after=Pt(40)
add_callout("Purpose", "A practical guide for administrators, project managers, vendors, content teams, and leadership. It explains what each screen does, who can use it, and how work moves from the field to approved communication.")
p=doc.add_paragraph("Prepared 24 August 2026  |  Based on the current FoundationHub application", style="Caption"); p.alignment=WD_ALIGN_PARAGRAPH.CENTER

chapter("How to use this handbook")
doc.add_paragraph("Read Chapters 1–3 first. Then use the chapter for your role and the task you are completing. Button labels and field names are written exactly as they appear in the application.")
add_table(["If you need to…","Go to"],[
    ("Understand access and roles","Chapter 2"),("Submit a field update","Chapter 5"),("Approve or return an update","Chapter 6"),
    ("Generate posts and summaries","Chapter 8"),("Send content to a channel","Chapter 9"),("Manage users","Chapter 12"),("Solve a problem","Chapter 14")],[2.55,3.95])
doc.add_heading("Contents", level=2)
add_bullets(["1. Platform overview", "2. Roles and permissions", "3. Sign-in and navigation", "4. Dashboard", "5. Projects and field updates", "6. Review and approval", "7. Media library", "8. Content generation", "9. Distribution", "10. Vendors", "11. Analytics and scores", "12. Settings and users", "13. End-to-end operating routines", "14. Troubleshooting, glossary, and support"])
add_callout("Important", "This handbook describes the current application. Some installations run in demo mode; others are connected to Supabase, storage, AI, and channel services. If a feature does not produce an external result, ask your administrator which integrations are enabled.", "FFF5E5", AMBER)

chapter("1. Platform overview", "One workspace for collecting evidence, reviewing impact, creating communications, and tracking delivery.")
doc.add_heading("What the platform does", level=2)
add_bullets(["Keeps project, vendor, budget, ownership, location, and reporting information together.", "Guides field teams through a seven-step update submission.", "Routes updates through review, revision, approval, and publishing statuses.", "Stores images and videos with the update that produced them.", "Creates channel-ready content packages from approved updates.", "Logs delivery to Telegram, WhatsApp, and Instagram.", "Calculates readiness, project health, and vendor performance indicators."])
doc.add_heading("Typical lifecycle", level=2)
add_steps([("Set up the work", "An administrator or project manager creates the vendor and project, assigns users, and sets reporting rules."),("Capture evidence", "A vendor or team member submits an update with activity, impact, story details, media, and flags."),("Review", "A reviewer approves, requests revision, or rejects the submission."),("Create content", "The content team generates a multi-channel package from an approved update."),("Distribute and learn", "The content team sends the package; leadership monitors delivery and operational indicators.")])
add_callout("Data visibility", "Most users see only the projects and vendors assigned to them. A super administrator sees the entire workspace.")

chapter("2. Roles and permissions")
add_table(["Role","Main access","Typical responsibility"],[
    ("Super admin / Admin","All modules","Workspace setup, projects, vendors, approvals, content, distribution, analytics, and users."),
    ("Project manager","Dashboard, Projects, Updates, Vendors, Media","Own assigned projects, review field updates, maintain partners and records."),
    ("Vendor","Dashboard, Updates, Media","Submit updates and view their own assigned work."),
    ("Content team","Dashboard, Updates, Vendors, Media, Content, Distribution","Review context, generate packages, and deliver approved stories."),
    ("Leadership","Dashboard, Vendors, Media, Analytics","Monitor impact, health, readiness, partner performance, and delivery."),
],[1.2,2.35,2.95])
doc.add_heading("Module access at a glance", level=2)
add_table(["Module","Admin","PM","Vendor","Content","Leadership"],[
    ("Dashboard","Yes","Yes","Yes","Yes","Yes"),("Projects","Yes","Yes","—","—","—"),("Updates","Yes","Yes","Yes","Yes","—"),
    ("Vendors","Yes","Yes","—","Yes","Yes"),("Media","Yes","Yes","Yes","Yes","Yes"),("Content","Yes","—","—","Yes","—"),
    ("Distribution","Yes","—","—","Yes","—"),("Analytics","Yes","—","—","—","Yes"),("Settings","Yes","—","—","—","—")],[1.45,0.8,0.75,0.8,1.0,1.1])
add_callout("Scoped access", "Employees and vendors may have a role that permits a module but still see only assigned projects and vendors. If expected records are missing, verify assignments in Settings.", "FFF5E5", AMBER)

chapter("3. Sign-in and navigation")
doc.add_heading("Sign in", level=2)
add_steps([("Open the login page", "Use the web address supplied by your administrator."),("Enter your User ID", "Use the username issued to you; it may not be your email address."),("Enter your password", "Passwords are case-sensitive."),("Select Sign in", "A successful login opens Dashboard. Invalid credentials return an error.")])
doc.add_heading("Move around the workspace", level=2)
doc.add_paragraph("The left sidebar shows only the modules allowed for your role. Select a module name to open it. Use Sign out when finishing on a shared device.")
add_bullets(["Dashboard: operational overview.", "Projects: create and maintain programmes.", "Updates: submit and review field evidence.", "Vendors: partner directory and scoring.", "Media: files attached to updates.", "Content: generated communication packages.", "Distribution: channel delivery and logs.", "Analytics: leadership summary.", "Settings: user accounts and assignments."])
add_callout("Security habit", "Never share credentials. Sign out on shared computers, and ask an administrator to change a compromised password immediately.", "FDECEC", RED)

chapter("4. Dashboard", "Your first view of workload, activity, and themes.")
doc.add_heading("What you see", level=2)
add_bullets(["Metric cards: headline counts and trends available to your account.", "Operational modules: pending reviews, approved content candidates, revision requests, vendors, media, and recent delivery activity.", "Projects by theme: groups projects by their category or thematic focus."])
doc.add_heading("How to read the dashboard", level=2)
add_steps([("Start with exceptions", "Check pending reviews and revision requests before routine work."),("Check recent evidence", "Confirm projects are reporting at the expected frequency."),("Follow through", "Open the relevant module to take action; dashboard cards are summaries, not substitutes for reviewing the record.")])

chapter("5. Projects and field updates")
doc.add_heading("Create or edit a project", level=2)
doc.add_paragraph("Admins and project managers use Projects. The create and edit forms contain the following information:")
add_table(["Field","Meaning / guidance"],[
    ("Name","Clear project title, 3–80 characters."),("Category / Sub-category","Theme and more specific programme type."),("State / District","Geographic reporting location."),("Start / End date","Planned project period."),("Budget","Non-negative amount in INR."),("Reporting frequency","Daily, weekly, fortnightly, or monthly."),("Internal owner","Admin or project manager responsible."),("Assigned vendors","At least one partner is required for normal update submission."),("Strategic / Emotional tags","Comma-separated labels used for context and storytelling."),("Project brief","Concise purpose, up to 500 characters."),("Beneficiary target","Expected non-negative whole-number outcome."),("Status","Draft, Active, On Hold, At Risk, Completed, or Archived."),("Require admin approval","Adds the intended higher review requirement for sensitive projects.")],[2.0,4.5])
add_callout("Deletion warning", "Deleting a project also removes linked updates and media metadata. Confirm the project name and dependencies before proceeding.", "FDECEC", RED)
doc.add_heading("Submit an update: seven guided steps", level=2)
add_steps([("Project", "Choose an available project. The vendor, location, and reporting frequency are carried forward automatically."),("What happened", "Describe the completed work and what changed today. Minimum 21 characters; maximum 300."),("Impact data", "Enter beneficiary count and type, set progress from 0–100%, and choose half day, full day, or multiple days."),("Story layer", "Explain why it matters, a highlight moment, a real quote, challenges, and next steps."),("Media", "Attach images or videos. Each file must be 25 MB or smaller."),("Flags", "Mark social-media worthy, urgent/time-sensitive, documentation only, and/or sensitive content."),("Review", "Check project, vendor, progress, media count, beneficiary details, story, and flags; then select Submit update and confirm.")])
add_callout("Draft saving", "Text and selections auto-save in this browser after a short delay. Returning restores the draft, but media files must be selected again. Successful submission clears the saved draft.")
doc.add_heading("How to write a strong field update", level=2)
add_bullets(["Use observable facts: who did what, where, and what changed.", "Enter progress based on the project plan, not optimism.", "Use a direct quote only if someone actually said it.", "State blockers plainly and name the next action.", "Mark sensitive content when identity, health, children, exact locations, or vulnerable communities require care."])

chapter("6. Review and approval")
doc.add_heading("Status meanings", level=2)
add_table(["Status","Meaning","Usual next action"],[
    ("Draft","Not yet formally submitted.","Complete and submit."),("Pending","Waiting for review.","Reviewer opens the item."),("In review","Review is underway.","Approve, request revision, or reject."),("Revision requested","Changes are required.","Submitter corrects and resubmits."),("Approved","Ready for content generation.","Content team generates package."),("Rejected","Not accepted for further use.","Consult reviewer before recreating."),("Published","Content has progressed through delivery.","Monitor log and reporting.")],[1.4,2.75,2.35])
doc.add_heading("Review an update", level=2)
add_steps([("Open Updates", "The review queue shows items available to your account."),("Check evidence", "Read the description, date, vendor, progress, media count, revisions, flags, and audit trail."),("Add a review note", "Explain the decision or requested change clearly; notes support accountability."),("Choose one action", "Approve, Request revision, or Reject, then confirm."),("Verify the status", "The queue and dashboard should reflect the new state.")])
add_callout("Vendor view", "Vendors see their own submitted updates and their review history, but do not receive reviewer action buttons.")

chapter("7. Media library")
doc.add_paragraph("Media groups all update attachments by project. Each card shows file name, storage provider, update status, caption, vendor, update date, file type, size, and an Open file link.")
doc.add_heading("Add media", level=2)
add_bullets(["Attach files during Step 5 of an update.", "Supported input is image or video.", "Maximum size is 25 MB per file.", "Duplicate selections with the same name, size, and modified time are ignored in the same draft.", "Media is available after successful update submission."])
doc.add_heading("Delete media", level=2)
doc.add_paragraph("Select Delete media on the file card. Deletion is permanent at the application layer and may remove the stored object. Only delete an incorrect, duplicate, unsafe, or unauthorized asset.")
add_callout("Privacy", "Before uploading, confirm consent and remove unnecessary personal data. Sensitive-content flags inform handling but do not replace consent or access controls.", "FDECEC", RED)

chapter("8. Content generation")
doc.add_paragraph("Admins and content-team users can generate content only for updates with Approved or Published status. Select Generate package on an eligible update.")
doc.add_heading("What a package contains", level=2)
add_bullets(["Emotional hook", "Short Instagram caption", "Long Instagram caption", "Reel script", "Carousel breakdown", "Telegram update", "WhatsApp digest", "CSR summary"])
doc.add_heading("Editorial review before use", level=2)
add_steps([("Check facts", "Compare names, quantities, dates, locations, progress, and quotes with the approved update."),("Check dignity and consent", "Avoid exploitative language, unsupported claims, or identifying sensitive beneficiaries."),("Adapt to channel", "Confirm tone, length, hashtags, links, and calls to action."),("Obtain any required approval", "Follow your organisation’s communication policy before distribution.")])
add_callout("AI caution", "Generated text is a draft. A human remains responsible for factual accuracy, permissions, brand voice, and publication.", "FFF5E5", AMBER)

chapter("9. Distribution")
doc.add_paragraph("Distribution lists packages that already have generated content. The top cards show ready packages, deliveries in the last seven days, and the latest channel.")
doc.add_heading("Send a package", level=2)
add_steps([("Confirm content readiness", "Open the project package and recheck the final wording."),("Choose a channel", "Use Telegram, WhatsApp, or Instagram."),("Select the send action", "The app calls the configured channel integration."),("Read the delivery log", "Confirm the channel, status message, and timestamp. Investigate failures rather than repeatedly sending.")])
add_callout("Connected services", "A delivery log records an attempt. Whether it reaches a real audience depends on valid channel credentials and integration configuration.")

chapter("10. Vendors")
doc.add_heading("Vendor Intelligence", level=2)
doc.add_paragraph("The module shows active partner count, average score, vendors needing follow-up (score below 70), contact and coverage details, assigned project count, and partner records.")
doc.add_heading("Onboard a vendor", level=2)
add_steps([("Enter partner details", "Name, primary contact, email, WhatsApp phone, organisation type, states, contract end date, rate card, and notes."),("Optionally issue a login", "Enter a vendor User ID and password to create credentials in the same step."),("Create the record", "Review and confirm."),("Assign projects", "Use Projects and/or Settings so the vendor can see and report on the correct work.")])
doc.add_heading("Maintain vendor records", level=2)
add_bullets(["Keep contract validity and contact information current.", "Use notes for operational context, not sensitive personal information.", "Review low scores with the underlying updates before judging performance.", "Only admins or super admins can delete vendor records."])

chapter("11. Analytics and scores")
doc.add_heading("Leadership summary", level=2)
add_bullets(["Active projects: projects currently marked Active.", "Vendor average score: average across visible partners.", "Average readiness: average readiness of visible updates.", "Channel deliveries: number of distribution log entries.", "Operational status: project, vendor, readiness score, and update status for each visible update."])
doc.add_heading("How scores are calculated", level=2)
add_table(["Score","Inputs","Interpretation"],[
    ("Update readiness (0–100)","Description detail; why it matters; highlight; quote; up to four media contributions; social-media flag; progress ≥50%.","Communication completeness, not impact quality."),
    ("Project health (0–100)","Average readiness, recent reporting bonus, pending/revision penalties, and a base value.","Operational reporting signal, not a financial or impact audit."),
    ("Vendor score","45% average readiness, 35% approval rate, 20% rate of updates with at least three media files.","Reporting reliability and content readiness signal."),
],[1.6,3.05,1.85])
add_callout("Use scores responsibly", "Scores help find records that need attention. Always read the underlying update, project context, and constraints before making a decision.", "FFF5E5", AMBER)

chapter("12. Settings and user administration")
doc.add_paragraph("Settings is restricted to administrators. It shows super-admin, employee, and vendor account totals and the access scope of every user.")
doc.add_heading("Create a user", level=2)
add_steps([("Choose account type", "Employee or vendor."),("Enter identity and credentials", "Full name, email, unique User ID, and password."),("Choose role", "Project manager, content team, leadership, or vendor as appropriate."),("Link vendor if needed", "Vendor accounts should be linked to the correct vendor record."),("Assign projects and vendors", "Select only the records required for the person’s work."),("Confirm Create user", "Share credentials securely and require good password hygiene.")])
doc.add_heading("Edit or delete a user", level=2)
doc.add_paragraph("Open Edit access, update identity, role, password (optional), projects, and vendors, then Save changes. Deleting an account cannot be undone. The super-admin account is protected from normal editing and deletion.")
add_callout("Least privilege", "Give each user only the modules and records needed for their job. Review assignments when responsibilities or vendor relationships change.")

chapter("13. End-to-end operating routines")
doc.add_heading("Vendor weekly routine", level=2)
add_bullets(["Sign in and check review feedback.", "Submit one update per meaningful reporting event.", "Attach clear, consented evidence.", "Respond promptly to revision requests.", "Confirm submitted items appear in Your submitted updates."])
doc.add_heading("Project manager routine", level=2)
add_bullets(["Check pending and revision queues.", "Review evidence against project plans and reporting frequency.", "Leave actionable notes and make one clear decision.", "Follow up with vendors below expected reporting or quality levels.", "Maintain project status, ownership, vendors, dates, and targets."])
doc.add_heading("Content team routine", level=2)
add_bullets(["Work only from Approved or Published updates.", "Generate the content package.", "Fact-check and edit for dignity, privacy, and brand voice.", "Distribute through the intended channel.", "Verify the delivery log and escalate failures."])
doc.add_heading("Administrator monthly routine", level=2)
add_bullets(["Review user access and remove obsolete assignments.", "Check contract dates and vendor contacts.", "Review At Risk and On Hold projects.", "Confirm storage, AI, and channel integrations are operating.", "Export or back up information according to organisational policy."])

chapter("14. Troubleshooting, glossary, and support")
doc.add_heading("Common problems", level=2)
add_table(["Problem","Likely cause","What to do"],[
    ("Cannot sign in","Wrong User ID/password or account issue.","Retry carefully; ask an admin to verify or reset the account."),("A module is missing","Your role does not include it.","Check the role matrix; request access only if job-required."),("Project/vendor not visible","The record is not assigned to you.","Ask an admin to check project and vendor assignments."),("Continue is disabled in update","No project selected or description is under 21 characters.","Select a project and add a sufficiently detailed description."),("Update will not submit","Vendor missing, invalid scope, bad progress value, unsupported file, or file over 25 MB.","Correct the indicated field; confirm the project has an assigned vendor."),("Draft returned without media","Browsers cannot restore file selections.","Select the media files again."),("No Generate package button","Update is not Approved/Published or your role lacks access.","Complete approval or contact the content team."),("Delivery not received","Channel integration or credentials may be unavailable.","Read the log and ask the administrator to verify configuration."),("Score seems low","Update lacks story/evidence, approval, or recent reporting.","Read the scoring section and improve the underlying workflow, not the number alone.")],[1.55,2.35,2.6])
doc.add_heading("Glossary", level=2)
add_table(["Term","Definition"],[
    ("Beneficiary","Person, animal, land area, water volume, or other outcome reached by the work."),("Readiness","How complete an update is for communication and review."),("Project health","Operational signal based on readiness, reporting freshness, and review backlog."),("Revision","A reviewer-requested correction or addition."),("Generated package","AI-assisted multi-channel content derived from an approved update."),("Distribution log","Record of a channel delivery attempt and its result."),("Scoped access","Visibility limited to assigned projects and vendors."),("Super admin","Protected administrator with full workspace access.")],[1.7,4.8])
doc.add_heading("When asking for help", level=2)
add_bullets(["State your role and the module name.", "Name the project or vendor, without sharing sensitive beneficiary data.", "Copy the exact on-screen error message.", "Include the time and action attempted.", "Do not send passwords or private access tokens."])
add_callout("Handbook boundary", "This is an end-user guide. Deployment, database migrations, environment variables, API credentials, and developer maintenance belong in a separate administrator or technical runbook.")

# Appendix
chapter("Appendix A. Quick-reference checklists")
doc.add_heading("Before submitting an update", level=2)
add_bullets(["Correct project selected", "Description is specific and at least 21 characters", "Progress is 0–100% and evidence-based", "Beneficiary count/type checked", "Story details and real quote reviewed", "Images/videos are relevant, consented, and ≤25 MB each", "Urgency, documentation, social, and sensitivity flags are accurate", "Final review completed"])
doc.add_heading("Before approving", level=2)
add_bullets(["Activity matches project scope", "Date, vendor, progress, and beneficiaries are plausible", "Media supports the claim", "Sensitive information is handled correctly", "Challenges and next steps are clear", "Review note explains the decision"])
doc.add_heading("Before distribution", level=2)
add_bullets(["Update is approved", "All facts match the source update", "Consent and privacy checked", "Brand voice and channel length checked", "Links and calls to action checked", "Required human approval received", "Delivery log reviewed after sending"])

doc.core_properties.title = "Astral Impact Hub — Complete User Handbook"
doc.core_properties.subject = "End-user guide for FoundationHub / Astral Impact Hub"
doc.core_properties.author = "Astral Foundation"
doc.core_properties.keywords = "Astral Impact Hub, user handbook, projects, updates, approvals, media, content, distribution"
doc.save(OUT)
print(OUT)
