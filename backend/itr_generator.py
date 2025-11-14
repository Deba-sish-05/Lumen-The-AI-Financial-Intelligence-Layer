import io
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from pypdf import PdfReader, PdfWriter

def _draw_multiline(can, x, y, text):
    t = can.beginText()
    t.setTextOrigin(x, y)
    for line in text.splitlines():
        t.textLine(line)
    can.drawText(t)


def _split_name(full_name: str):
    parts = full_name.strip().split()
    if len(parts) == 0:
        return "", "", ""
    if len(parts) == 1:
        return parts[0], "", ""
    if len(parts) == 2:
        return parts[0], "", parts[1]
    return parts[0], " ".join(parts[1:-1]), parts[-1]

def compute_financials(transactions, employment, salary):
    r = {}

    r["electricity_expenditure"] = abs(sum(
        t["amount"] for t in transactions
        if t.get("category") == "electricity" and t["amount"] < 0
    ))

    if employment.lower() == "pensioner":
        r["salary_pensioner"] = salary
        r["salary_non_pensioner"] = 0
    else:
        r["salary_pensioner"] = 0
        r["salary_non_pensioner"] = salary

    r["income_over_salary"] = sum(
        t["amount"] for t in transactions
        if t["amount"] > 0 and t.get("category") != "salary"
    )

    r["gross_salary_B1"] = r["salary_non_pensioner"] + r["salary_pensioner"]

    r["entertainment_income"] = sum(
        t["amount"] for t in transactions
        if t.get("category") == "entertainment" and t["amount"] > 0
    )

    r["total_income"] = r["gross_salary_B1"] + r["income_over_salary"]

    total = r["total_income"]
    tax = 0
    slabs = [
        (1500000, 0.30),
        (1200000, 0.20),
        (900000, 0.15),
        (600000, 0.10),
        (300000, 0.05),
    ]

    for limit, rate in slabs:
        if total > limit:
            tax += (total - limit) * rate
            total = limit

    r["tax_payable"] = round(tax, 2)

    return r

def generate_itr_pdf(form_data, transactions, template_path):
    """
    form_data → dict containing name, dob, address, pan, aadhaar, etc.
    transactions → user’s transactions
    template_path → path to template PDF

    returns BytesIO containing merged PDF
    """

    computed = compute_financials(
        transactions,
        form_data.get("employment"),
        form_data.get("salary", 0)
    )
    fd = {**form_data, **computed}

    reader = PdfReader(template_path)
    writer = PdfWriter()

    def overlay_page1():
        buf = io.BytesIO()
        can = canvas.Canvas(buf, pagesize=reader.pages[0].mediabox)

        can.setFont("Helvetica", 9)
        can.setFillColor(colors.black)

        # Split Name
        first, middle, last = _split_name(fd["name"])

        can.drawString(189, 750, first)
        can.drawString(189, 720, middle)
        can.drawString(189, 690, last)

        can.drawString(220, 720, fd["dob"])
        can.drawString(302, 720, fd["aadhaar"])
        can.drawString(42, 720, fd["pan"])

        can.drawString(80, 675, fd["mobile"])
        can.drawString(159, 665, fd["email"])
        can.drawString(420, 610, fd["employment"])

        _draw_multiline(can, 280, 675, fd["address"])

        can.save()
        buf.seek(0)
        return PdfReader(buf).pages[0]

    def overlay_page2():
        buf = io.BytesIO()
        can = canvas.Canvas(buf, pagesize=reader.pages[1].mediabox)
        can.setFont("Helvetica", 9)

        if fd["electricity_expenditure"] > 100000:
            can.drawString(470, 745, str(fd["electricity_expenditure"]))

        if fd["employment"].lower() == "pensioner":
            can.drawString(360, 620, str(fd["salary_pensioner"]))
        else:
            can.drawString(360, 665, str(fd["salary_non_pensioner"]))

        if fd["entertainment_income"] != 0:
            can.drawString(360, 505, str(fd["entertainment_income"]))

        if fd["income_over_salary"] != 0:
            can.drawString(480, 315, str(fd["income_over_salary"]))

        can.drawString(480, 250, str(fd["total_income"]))
        can.drawString(480, 670, str(fd["gross_salary_B1"]))

        can.save()
        buf.seek(0)
        return PdfReader(buf).pages[0]

    def overlay_page3():
        buf = io.BytesIO()
        can = canvas.Canvas(buf, pagesize=reader.pages[2].mediabox)
        can.setFont("Helvetica", 9)

        can.drawString(133, 550, str(fd["tax_payable"]))

        can.save()
        buf.seek(0)
        return PdfReader(buf).pages[0]

    writer.add_page(reader.pages[0].merge_page(overlay_page1()))
    writer.add_page(reader.pages[1].merge_page(overlay_page2()))
    writer.add_page(reader.pages[2].merge_page(overlay_page3()))

    output_stream = io.BytesIO()
    writer.write(output_stream)
    output_stream.seek(0)
    return output_stream
