import os
import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_jwt_extended import jwt_required, get_jwt_identity
from model import db, User, Transaction, Document
from sqlalchemy import func
from auth import auth_bp
from werkzeug.security import generate_password_hash, check_password_hash
from flask import send_file
from itr_generator import generate_itr_pdf
from dotenv import load_dotenv
from transactions import transactions_bp
from document import document_bp
from gst_check import lookup_gstin_using_keys, api_keys, AllKeysExhausted
from flask import send_from_directory


load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}})


basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(basedir, "database.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(minutes=2000)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = datetime.timedelta(days=7)

db.init_app(app)
JWTManager(app)

app.register_blueprint(auth_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(document_bp)

@app.post("/gst/check_public")
@jwt_required()
def gst_check():
    data = request.get_json() or {}
    gstin = (data.get("gstin") or "").strip()
    if not gstin:
        return jsonify({"success": False, "error": "Please provide a GSTIN"}), 400

    try:
        result = lookup_gstin_using_keys(api_keys, gstin)
        resp_payload = {
            "success": True,
            "data": result.get("result", {}),
            "meta": {
                "used_key_index": result.get("used_key_index"),
                "used_key_label": result.get("used_key_label"),
            },
            "raw_wrapper": result,
        }
        return jsonify(resp_payload), 200
    except:
        return jsonify({"success": False, "error": "Invalid GSTIN was given"}), 200

@app.post("/itr/generate")
@jwt_required()
def generate_itr():
    # try:
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    data = data.get("form_data",{})

    user = User.query.filter_by(id=user_id).first()
    user.aadhar_number = data.get("aadharNumber")
    user.pan_number = data.get("panNumber")
    user.date_of_birth = data.get("dateOfBirth")
    user.address = data.get("address")
    user.employment_type = data.get("employmentType")
    user.annual_salary = data.get("salary", 0)

    db.session.commit()
    form_data = data
    st3 = user
    form_data['name'] = st3.first_name+' '+st3.last_name

    st = form_data['dob']
    # print(st)
    form_data['dob'] = st[8]+'  '+st[9]+'  '+st[5]+'  '+st[6]+'  '+st[0]+'  '+st[1]+'  '+st[2]+'  '+st[3]
    st = form_data['pan']
    form_data['pan'] = st[0]+'  '+st[1]+'  '+st[2]+'    '+st[3]+'  '+st[4]+'  '+st[5]+'  '+st[6]+'   '+st[7]+'   '+st[8]+'   '+st[9]
    st = form_data['aadhaar']
    form_data['aadhaar'] = st[0]+'  '+st[1]+'  '+st[2]+'  '+st[3]+'  '+st[4]+'  '+st[5]+'  '+st[6]+'  '+st[7]+'  '+st[8]+'  '+st[9]+'  '+st[10]+'   '+st[11]
    form_data['email'] = st3.email
    form_data['mobile'] = st3.phone_number
    form_data['salary'] = st3.annual_salary
    # print(st3.email,st3.annual_salary)
    st = form_data['address']
    st = st.split('\n')
    form_data['address'] = "Address: (A8)"+"         "+st[0]+("\n                               "+st[1] if len(st)>1 else "")
    if not form_data:
        return jsonify({"error": "form_data is required"}), 400

    user_transactions = Transaction.query.filter_by(user_id=user_id).all()
    transactions = [
        {
            "amount": t.amount,
            "category": t.category,
        }
        for t in user_transactions
    ]

    if len(transactions) == 0:
        return jsonify({"error": "No transactions found for user"}), 404

    pdf_stream = generate_itr_pdf(
        form_data=form_data,
        transactions=transactions,
        template_path="ITR_TEMPLATE.pdf",
    )

    return send_file(
        pdf_stream,
        as_attachment=True,
        download_name="ITR_Filled.pdf",
        mimetype="application/pdf"
    )
    # except Exception as e:
    #     print("ITR generation error:", e)
    #     return jsonify({"error": "Failed to generate PDF"}), 500

@app.get("/documents/<filename>")
def download_file(filename):
    return send_from_directory("documents", filename, as_attachment=True)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # add base users here if i need to.

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port,debug=True)