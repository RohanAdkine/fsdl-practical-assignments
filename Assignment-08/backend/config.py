import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/compiler_visualizer")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
    JWT_ACCESS_TOKEN_EXPIRES = False  # tokens don't expire in dev
