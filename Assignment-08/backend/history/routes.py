"""
Compilation history routes.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from database import get_db
from bson import ObjectId
import datetime

history_bp = Blueprint("history", __name__)


def _serialize(doc):
    doc["_id"] = str(doc["_id"])
    if "userId" in doc:
        doc["userId"] = str(doc["userId"])
    return doc


@history_bp.route("/history", methods=["GET"])
@jwt_required(optional=True)
def get_history():
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        user_id = None

    db = get_db()
    if user_id:
        items = list(db.compilations.find({"userId": ObjectId(user_id)}).sort("createdAt", -1).limit(30))
    else:
        # Return recent anonymous compilations stored in session (just return empty for non-auth)
        items = []

    return jsonify([_serialize(i) for i in items]), 200


@history_bp.route("/history", methods=["POST"])
@jwt_required(optional=True)
def save_history():
    user_id = get_jwt_identity()
    data = request.get_json()

    doc = {
        "userId": ObjectId(user_id) if user_id else None,
        "language": data.get("language", "python"),
        "code": data.get("code", ""),
        "results": data.get("results", {}),
        "createdAt": datetime.datetime.utcnow(),
    }

    db = get_db()
    result = db.compilations.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["userId"] = str(doc["userId"]) if doc["userId"] else None
    doc["createdAt"] = doc["createdAt"].isoformat()
    return jsonify(doc), 201


@history_bp.route("/history/<item_id>", methods=["DELETE"])
@jwt_required()
def delete_history(item_id):
    user_id = get_jwt_identity()
    db = get_db()
    result = db.compilations.delete_one({"_id": ObjectId(item_id), "userId": ObjectId(user_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Not found or unauthorized"}), 404
    return jsonify({"message": "Deleted"}), 200
