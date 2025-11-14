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

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # add base users here if i need to.

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port,debug=True)