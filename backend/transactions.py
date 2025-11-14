from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from model import db, Transaction
from datetime import datetime

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")

@transactions_bp.get("/")
@jwt_required()
def get_transactions():
    user_id = int(get_jwt_identity())

    # Optional pagination
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))

    query = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.created_at.desc())
    paginated = query.paginate(page=page, per_page=limit, error_out=False)

    transactions = [
        {
            "id": t.id,
            "item_name": t.item_name,
            "amount": t.amount,
            "category": t.category,
            "payment_mode": t.payment_mode,
            "transaction_date": t.transaction_date.isoformat(),
            "vendor": t.vendor,
            "description": t.description,
            "tags": t.tags,
            "created_at": t.created_at.isoformat(),
        }
        for t in paginated.items
    ]

    return jsonify({
        "transactions": transactions,
        "page": paginated.page,
        "total_pages": paginated.pages,
        "total": paginated.total,
    }), 200

@transactions_bp.post("/add")
@jwt_required()
def add_transaction():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    required_fields = ["item_name", "amount", "category", "payment_mode", "transaction_date"]

    # validate required fields
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # parse date
    try:
        transaction_date = datetime.fromisoformat(data["transaction_date"]).date()
    except Exception:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    t = Transaction(
        user_id=user_id,
        item_name=data["item_name"],
        amount=data["amount"],
        category=data["category"],
        payment_mode=data["payment_mode"],
        transaction_date=transaction_date,
        vendor=data.get("vendor"),
        description=data.get("description"),
        tags=data.get("tags"),
    )

    db.session.add(t)
    db.session.commit()

    return jsonify({"message": "Transaction added", "id": t.id}), 201
