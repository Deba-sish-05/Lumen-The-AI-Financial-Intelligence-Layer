from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from model import db, Transaction,Document
from datetime import datetime

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")

@transactions_bp.get("/<int:transaction_id>")
@jwt_required()
def get_transaction(transaction_id):
    user_id = int(get_jwt_identity())

    tx = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404

    doc = Document.query.filter_by(transaction_id=transaction_id).first()

    return jsonify({
        "id": tx.id,
        "item_name": tx.item_name,
        "amount": tx.amount,
        "category": tx.category,
        "payment_mode": tx.payment_mode,
        "transaction_date": tx.transaction_date.isoformat(),
        "vendor": tx.vendor,
        "description": tx.description,
        "tags": tx.tags,
        "created_at": tx.created_at.isoformat(),
        "file_url": doc.file_url if doc else None,
        "status": doc.status if doc else "verified"
    }), 200

@transactions_bp.get("/all")
@jwt_required()
def get_transactions():
    user_id = int(get_jwt_identity())
    page = int(request.args.get("page", 1))
    category_filter = request.args.get("category", "").strip().lower()

    # Base query
    query = Transaction.query.filter_by(user_id=user_id)

    # Apply category filter ONLY if provided
    if category_filter:
        query = query.filter(Transaction.category == category_filter)

    query = query.order_by(Transaction.created_at.desc())

    paginated = query.paginate(page=page, per_page=20, error_out=False)

    transactions = []
    for t in paginated.items:
        doc = Document.query.filter_by(transaction_id=t.id).first()
        transactions.append({
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
            "file_url": doc.file_url if doc else None,
            "status": doc.status if doc else "verified"
        })

    return jsonify({
        "transactions": transactions,
        "page": paginated.page,
        "total_pages": paginated.pages,
        "total": paginated.total,
        "category_filter": category_filter or None,
    }), 200


@transactions_bp.post("/add")
@jwt_required()
def add_transaction():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    required_fields = ["item_name", "amount", "category", "payment_mode", "transaction_date"]
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    try:
        transaction_date = datetime.fromisoformat(data["transaction_date"]).date()
    except Exception:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    today = datetime.utcnow().date()
    if transaction_date > today:
        return jsonify({"error": "Transaction date cannot be in the future"}), 400
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
