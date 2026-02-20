"""
ChefCommunity Backend - Flask Application
Punto de entrada principal con factory pattern
"""
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db


def create_app():
    """Factory function para crear la aplicación Flask"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Inicializar extensiones
    db.init_app(app)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    jwt = JWTManager(app)
    
    import sys
    from flask import jsonify

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"DEBUG: Invalid Token: {error}", file=sys.stderr, flush=True)
        return jsonify({
            'error': 'Invalid token',
            'message': str(error)
        }), 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"DEBUG: Missing Token: {error}", file=sys.stderr, flush=True)
        return jsonify({
            'error': 'Authorization header missing',
            'message': str(error)
        }), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"DEBUG: Expired Token", file=sys.stderr, flush=True)
        return jsonify({
            'error': 'Token expired',
            'message': 'Please login again'
        }), 401
        
    @app.before_request
    def log_request_info():
        from flask import request
        print(f"DEBUG: Request to {request.path} from {request.remote_addr}", file=sys.stderr, flush=True)
        print(f"DEBUG: Request Headers: {request.headers}", file=sys.stderr, flush=True)

    # Registrar blueprints
    
    # Registrar blueprints
    from routes.recipes import recipes_bp
    from routes.auth import auth_bp
    from routes.user import user_bp
    
    app.register_blueprint(recipes_bp, url_prefix='/api/recipes')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    
    # Ruta de health check
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': 'ChefCommunity API running'}
    
    # Ruta raíz
    @app.route('/')
    def index():
        return {
            'app': 'ChefCommunity API',
            'version': '1.0.0',
            'endpoints': {
                'recipes': '/api/recipes',
                'auth': '/api/auth',
                'users': '/api/users',
                'health': '/api/health'
            }
        }
    
    return app


# Crear instancia de la app
app = create_app()


if __name__ == '__main__':
    # Crear tablas si no existen (solo en desarrollo)
    with app.app_context():
        try:
            db.create_all()
            print('✅ Conexión a base de datos exitosa')
        except Exception as e:
            print(f'⚠️  Error de conexión a MySQL: {e}')
            print('💡 Asegúrate de que MySQL esté corriendo y la base de datos exista')
    
    # Iniciar servidor de desarrollo
    print('🚀 Iniciando ChefCommunity API en http://localhost:5000')
    app.run(debug=True, port=5000)
