"""
Main Flask application entry point.
"""
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = Config.JWT_ACCESS_TOKEN_EXPIRES

    # Enable CORS for all routes (React dev server on port 5173)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    JWTManager(app)

    # Register blueprints
    from auth.routes import auth_bp
    from compiler.routes import compiler_bp
    from history.routes import history_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(compiler_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "Compiler Visualizer API running"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=Config.FLASK_PORT)
