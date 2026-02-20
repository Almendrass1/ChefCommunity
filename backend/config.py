"""
Configuración del backend Flask para ChefCommunity
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Configuración base de Flask"""
    
    # Secreto para JWT y sesiones
    # Secreto para JWT y sesiones
    SECRET_KEY = 'super-fixed-secret-key-chef-community-2026'
    JWT_SECRET_KEY = 'super-fixed-secret-key-chef-community-2026'
    
    # Configuración de MySQL
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = os.getenv('MYSQL_PORT', '3306')
    MYSQL_DB = os.getenv('MYSQL_DB', 'chef_community')
    
    # URI de conexión SQLAlchemy
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_COOKIE_CSRF_PROTECT = False # Disable CSRF protection for headers
    
    # CORS - Permitir frontend en desarrollo
    CORS_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ]
