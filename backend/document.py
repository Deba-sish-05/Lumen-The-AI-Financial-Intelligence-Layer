from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from model import db, Document
import os
import uuid

document_bp = Blueprint("document", __name__, url_prefix="/document")

@document_bp.get("/")
@jwt_required()
def get_documents():
    user_id = int(get_jwt_identity())

    # pagination
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))

    query = Document.query.filter_by(user_id=user_id).order_by(Document.uploaded_at.desc())
    paginated = query.paginate(page=page, per_page=limit, error_out=False)

    documents = [
        {
            "id": d.id,
            "file_name": d.file_name,
            "file_url": d.file_url,
            "vendor_name": d.vendor_name,
            "category": d.category,
            "notes": d.notes,
            "status": d.status,
            "transaction_id": d.transaction_id,
            "uploaded_at": d.uploaded_at.isoformat(),
        }
        for d in paginated.items
    ]

    return jsonify({
        "documents": documents,
        "page": paginated.page,
        "total_pages": paginated.pages,
        "total": paginated.total,
    }), 200


@document_bp.post("/add")
# @jwt_required()
def add_document():
    # user_id = int(get_jwt_identity())
    if "file" not in request.files:
        return jsonify({"error": "File is required"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Invalid file name"}), 400
    allowed_ext = {"pdf", "png", "jpg", "jpeg"}
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed_ext:
        return jsonify({"error": "Unsupported file type"}), 400
    upload_folder = os.path.join(os.getcwd(), "documents")
    os.makedirs(upload_folder, exist_ok=True)
    new_filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(upload_folder, new_filename)

    file.save(file_path)

    # Metadata
    vendor = request.form.get("vendor_name")
    category = request.form.get("category")
    notes = request.form.get("notes")
    transaction_id = request.form.get("transaction_id")

    doc = Document(
        user_id=1,
        transaction_id=transaction_id if transaction_id else None,
        file_name=new_filename,
        file_url=f"/documents/{new_filename}",
        vendor_name=vendor,
        category=category,
        notes=notes,
        status="pending"
    )

    db.session.add(doc)
    db.session.commit()

    return jsonify({"message": "Document uploaded", "id": doc.id}), 201
