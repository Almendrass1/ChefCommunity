from app import app, db
from sqlalchemy import text

def update_schema():
    with app.app_context():
        try:
            # Intentar añadir la columna calories
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE recipes ADD COLUMN calories INT"))
                conn.commit()
            print("✅ Columna 'calories' añadida exitosamente.")
        except Exception as e:
            print(f"⚠️ Error (puede que ya exista): {e}")

if __name__ == "__main__":
    update_schema()
