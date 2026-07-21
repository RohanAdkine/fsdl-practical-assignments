"""
MongoDB connection helper.
"""
from pymongo import MongoClient
from config import Config


def get_db():
    """Returns MongoDB database instance."""
    client = MongoClient(Config.MONGO_URI)
    return client.get_default_database()
