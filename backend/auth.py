from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from model import db, User, Transaction, Document

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

def _claims(user):
    return {
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}"
    }

@auth_bp.post("/signup")
def signup():
    data = request.get_json() or {}

    first = data.get("first_name")
    last = data.get("last_name")
    email = data.get("email")
    phone = data.get("phone_number")
    pwd = data.get("password")

    if not all([first, last, email, phone, pwd]):
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        first_name=first,
        last_name=last,
        email=email,
        phone_number=phone,
        password_hash=generate_password_hash(pwd),
        organization=data.get("organization"),
        aadhar_number=data.get("aadhar_number"),
        pan_number=data.get("pan_number"),
        date_of_birth=data.get("date_of_birth"),
        employment_type=data.get("employment_type"),
        annual_salary=data.get("annual_salary"),
        address=data.get("address"),
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Account created"}), 201

@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email, pwd = data.get("email"), data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, pwd):
        return jsonify({"error": "Invalid credentials"}), 401

    access = create_access_token(identity=str(user.id), additional_claims=_claims(user))
    refresh = create_refresh_token(identity=str(user.id), additional_claims=_claims(user))

    return jsonify({"access": access, "refresh": refresh})


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "organization": user.organization,
        "aadhar_number": user.aadhar_number,
        "pan_number": user.pan_number,
        "date_of_birth": user.date_of_birth,
        "employment_type": user.employment_type,
        "annual_salary": user.annual_salary,
        "address": user.address,
    })


@auth_bp.put("/update-profile")
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    for field in [
        "first_name", "last_name", "phone_number", "organization",
        "aadhar_number", "pan_number", "date_of_birth", "employment_type",
        "annual_salary", "address"
    ]:
        if field in data and data[field] is not None:
            setattr(user, field, data[field])

    new_email = data.get("email")
    if new_email:
        existing = User.query.filter(User.email == new_email, User.id != user_id).first()
        if existing:
            return jsonify({"error": "Email already in use"}), 400
        user.email = new_email

    db.session.commit()
    return jsonify({"message": "Profile updated"}), 200
