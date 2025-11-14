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
import requests
import json
import re
from dotenv import load_dotenv
from transactions import transactions_bp
from document import document_bp
from gst_check import lookup_gstin_using_keys, api_keys, AllKeysExhausted

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

# @app.route('/api/analytics')
# def analytics():
#     total_users = int(db.session.query(func.count(User.id)).scalar() or 0)
#     total_students = int(db.session.query(func.count(User.id)).filter(User.role == 'student').scalar() or 0)
#     total_staff = int(db.session.query(func.count(User.id)).filter(User.role != 'student').scalar() or 0)
#     total_workers = int(db.session.query(func.count(WorkerInfo.id)).scalar() or 0)

#     total_notices = int(db.session.query(func.count(Notice.id)).scalar() or 0)
#     total_doctors = int(db.session.query(func.count(Doctor.id)).scalar() or 0)
#     doctors_available_today = int(db.session.query(func.count(Doctor.id)).filter(Doctor.available_today == True).scalar() or 0)
#     student_medical = int(db.session.query(func.count(StudentMedical.id)).scalar() or 0)

#     issues_by_status_q = db.session.query(Issue.status, func.count(Issue.id)).group_by(Issue.status).all()
#     issues_by_status = [{'status': s or 'Unknown', 'count': int(c)} for s, c in issues_by_status_q]

#     today = datetime.date.today()
#     start = today - datetime.timedelta(days=29)

#     issues_30_q = db.session.query(func.date(Issue.created_at), func.count(Issue.id)) \
#         .filter(Issue.created_at >= start) \
#         .group_by(func.date(Issue.created_at)) \
#         .order_by(func.date(Issue.created_at)).all()

#     date_map = {}
#     for d, c in issues_30_q:
#         if d is None:
#             continue
#         if hasattr(d, "isoformat"):
#             key = d.isoformat()
#         else:
#             key = str(d)
#         date_map[key] = int(c)

#     issues_last_30_days = []
#     for i in range(30):
#         dd = start + datetime.timedelta(days=i)
#         key = dd.isoformat()
#         issues_last_30_days.append({'date': key, 'count': date_map.get(key, 0)})

#     try:
#         first_month = (today.replace(day=1) - datetime.timedelta(days=365)).replace(day=1)
#         notices_q = db.session.query(func.strftime('%Y-%m', Notice.created_at), func.count(Notice.id)) \
#             .filter(Notice.created_at >= first_month) \
#             .group_by(func.strftime('%Y-%m', Notice.created_at)) \
#             .order_by(func.strftime('%Y-%m', Notice.created_at)).all()
#         notices_last_12_months = [{'month': m, 'count': int(c)} for m, c in notices_q]
#     except Exception:
#         first_month = (today.replace(day=1) - datetime.timedelta(days=365)).replace(day=1)
#         notices_q = db.session.query(func.to_char(Notice.created_at, 'YYYY-MM'), func.count(Notice.id)) \
#             .filter(Notice.created_at >= first_month) \
#             .group_by(func.to_char(Notice.created_at, 'YYYY-MM')) \
#             .order_by(func.to_char(Notice.created_at, 'YYYY-MM')).all()
#         notices_last_12_months = [{'month': m, 'count': int(c)} for m, c in notices_q]

#     top_reporters_q = db.session.query(Issue.created_by, func.count(Issue.id)) \
#         .group_by(Issue.created_by) \
#         .order_by(func.count(Issue.id).desc()) \
#         .limit(10).all()
#     top_reporters = [{'reporter': (r or 'Unknown'), 'count': int(c)} for r, c in top_reporters_q]

#     totals = {
#         'users': total_users,
#         'students': total_students,
#         'staff': total_staff,
#         'workers': total_workers,
#         'open_issues': int(db.session.query(func.count(Issue.id)).filter(Issue.status == 'Pending').scalar() or 0),
#         'inprogress_issues': int(db.session.query(func.count(Issue.id)).filter(Issue.status == 'In Progress').scalar() or 0),
#         'resolved_issues': int(db.session.query(func.count(Issue.id)).filter(Issue.status == 'Resolved').scalar() or 0),
#         'notices': total_notices,
#         'doctors': total_doctors,
#         'doctors_available_today': doctors_available_today,
#         'student_medical_records': student_medical,
#     }

#     series = {
#         'issues_last_30_days': issues_last_30_days,
#         'notices_last_12_months': notices_last_12_months,
#         'issues_by_status': issues_by_status,
#         'top_reporters': top_reporters,
#     }

#     return jsonify({'totals': totals, 'series': series})

@app.post("/gst/check")
@jwt_required()
def gst_check_route():
    user_id = int(get_jwt_identity())

    data = request.get_json() or {}
    gstin = data.get("gstin")

    try:
        result = lookup_gstin_using_keys(api_keys, gstin)
        return jsonify({
            "success": True,
            "used_key": result["used_key_label"],
            "data": result["result"]
        }), 200
    except:
        return jsonify({
            "success": False,
            "error": "Unexpected error",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # add base users here if i need to.

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port,debug=True)