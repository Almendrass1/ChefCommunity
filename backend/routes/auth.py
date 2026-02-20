"""
Blueprint de autenticación
POST /api/auth/register - Registro de usuario
POST /api/auth/login - Inicio de sesión
GET /api/auth/me - Usuario actual
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registra un nuevo usuario"""
    data = request.get_json()
    
    # Validaciones básicas
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Faltan datos requeridos'}), 400
    
    # Comprobar si existe
    if User.query.filter((User.username == data['username']) | (User.email == data['email'])).first():
        return jsonify({'error': 'Usuario o email ya existe'}), 409
    
    # Hash password
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    
    # Crear usuario
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed.decode('utf-8'),
        rol=data.get('rol', 'aprendiz'),
        bio=data.get('bio', ''),
        avatar_url=data.get('avatar_url', '')
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Generar token
        token = create_access_token(identity=str(new_user.id))
        
        return jsonify({
            'message': 'Usuario creado exitosamente',
            'token': token,
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Inicia sesión y devuelve token"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Faltan credenciales'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
        token = create_access_token(identity=str(user.id))
        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 200
    
    return jsonify({'error': 'Credenciales inválidas'}), 401


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Obtiene datos del usuario logueado"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    return jsonify(user.to_dict()), 200
