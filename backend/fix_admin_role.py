import sys
import os
sys.path.append(os.getcwd())
from app import create_app
from models import db, User

app = create_app()

with app.app_context():
    user = User.query.filter_by(username='admin').first()
    if user:
        print(f"Updating user {user.username} from {user.rol} to admin")
        user.rol = 'admin'
        db.session.commit()
        print("Update successful")
    else:
        print("User admin not found")

    # Verify
    user = User.query.filter_by(username='admin').first()
    print(f"User {user.username} role is now: {user.rol}")
