from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Required
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Optional
    organization = db.Column(db.String(120), nullable=True)
    aadhar_number = db.Column(db.String(20), nullable=True)
    pan_number = db.Column(db.String(20), nullable=True)
    date_of_birth = db.Column(db.String(20), nullable=True)
    employment_type = db.Column(db.String(50), nullable=True)
    annual_salary = db.Column(db.Integer, nullable=True)
    address = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Link to user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Required fields
    item_name = db.Column(db.String(120), nullable=False)      
    amount = db.Column(db.Float, nullable=False)             
    category = db.Column(db.String(50), nullable=False)  
    payment_mode = db.Column(db.String(50), nullable=False)  
    transaction_date = db.Column(db.Date, nullable=False) 

    # Optional fields
    vendor = db.Column(db.String(120), nullable=True)     
    description = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Required links
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transaction.id'), nullable=False)

    # File info
    file_name = db.Column(db.String(255), nullable=False)   
    file_url = db.Column(db.String(500), nullable=False)  

    # Optional metadata
    vendor_name = db.Column(db.String(120), nullable=True)
    category = db.Column(db.String(80), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    # Status: pending, verified, rejected
    status = db.Column(db.String(20), nullable=False, default="pending")
    
    uploaded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
