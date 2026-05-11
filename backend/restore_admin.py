from app import create_app
from models import db, User
import sys

# Forzar UTF-8 para evitar errores en terminales Windows
try:
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
except:
    pass

app = create_app()
with app.app_context():
    try:
        user = User.query.filter_by(email='admin@gmail.com').first()
        if user:
            user.rol = 'admin'
            db.session.commit()
            print(f"Usuario {user.username} ({user.email}) restaurado a rol ADMIN.")
        else:
            print("No se encontro el usuario admin@gmail.com")
    except Exception as e:
        print(f"Error al conectar con la DB: {e}")
