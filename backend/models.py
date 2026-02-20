"""
Modelos SQLAlchemy para ChefCommunity
Mapean las tablas de MySQL definidas en create_database.sql
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    """Modelo de usuarios"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.Enum('saludable', 'aprendiz', 'chef', 'admin'), default='aprendiz')
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relaciones
    recipes = db.relationship('Recipe', backref='author_user', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='user', lazy=True, cascade='all, delete-orphan')
    collections = db.relationship('RecipeCollection', backref='owner', lazy=True, cascade='all, delete-orphan')
    following = db.relationship('Follow', foreign_keys='Follow.follower_id', backref='follower', lazy=True, cascade='all, delete-orphan')
    followers = db.relationship('Follow', foreign_keys='Follow.followed_id', backref='followed', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'rol': self.rol,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'followers_count': len(self.followers),
            'following_count': len(self.following)
        }


class Ingredient(db.Model):
    """Modelo de ingredientes (maestro)"""
    __tablename__ = 'ingredients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    unit = db.Column(db.String(20))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'unit': self.unit
        }


class Recipe(db.Model):
    """Modelo de recetas"""
    __tablename__ = 'recipes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    instructions = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    video_url = db.Column(db.String(255))
    main_image_url = db.Column(db.String(255))
    difficulty = db.Column(db.Enum('Fácil', 'Media', 'Difícil'), default='Media')
    prep_time = db.Column(db.Integer)  # en minutos
    calories = db.Column(db.Integer)   # Calorías por porción
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relaciones
    ingredients = db.relationship('RecipeIngredient', backref='recipe', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='recipe', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='recipe', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_author=True):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'instructions': self.instructions,
            'category': self.category,
            'video_url': self.video_url,
            'main_image_url': self.main_image_url,
            'difficulty': self.difficulty,
            'prep_time': self.prep_time,
            'calories': self.calories,
            'author_id': self.author_id,
            'likes_count': len(self.likes),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_author and self.author_user:
            data['author'] = self.author_user.username
            data['author_avatar'] = self.author_user.avatar_url
        return data


class RecipeIngredient(db.Model):
    """Modelo de ingredientes por receta (N:M)"""
    __tablename__ = 'recipe_ingredients'
    
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), primary_key=True)
    ingredient_id = db.Column(db.Integer, db.ForeignKey('ingredients.id'), primary_key=True)
    quantity = db.Column(db.Numeric(10, 2))
    
    # Relación con ingrediente
    ingredient = db.relationship('Ingredient', lazy=True)
    
    def to_dict(self):
        # Conversion logic for display
        unit = self.ingredient.unit if self.ingredient else 'ud'
        qty = float(self.quantity) if self.quantity else 0
        
        if unit:
            unit_lower = unit.lower()
            if unit_lower in ['oz', 'ounce', 'ounces', 'onza', 'onzas']:
                qty = qty * 28.35
                unit = 'g'
            elif unit_lower in ['lb', 'pound', 'pounds', 'libra', 'libras']:
                qty = qty * 453.59
                unit = 'g'
                if qty >= 1000:
                    qty = qty / 1000
                    unit = 'kg'
            elif unit_lower in ['unit', 'count']:
                unit = 'ud'
            elif unit_lower in ['tbsp', 'cda']:
                unit = 'cda'
            elif unit_lower in ['tsp', 'cdta']:
                unit = 'cdta'
            elif unit_lower in ['cup', 'cups', 'taza']:
                unit = 'taza'
        
        return {
            'ingredient_id': self.ingredient_id,
            'name': self.ingredient.name if self.ingredient else None,
            'unit': unit,
            'quantity': round(qty, 2) if qty % 1 else int(qty)
        }


class UserStock(db.Model):
    """Modelo de despensa/nevera del usuario"""
    __tablename__ = 'user_stock'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    ingredient_id = db.Column(db.Integer, db.ForeignKey('ingredients.id'), primary_key=True)
    quantity = db.Column(db.Numeric(10, 2))
    
    # Relación con ingrediente
    ingredient = db.relationship('Ingredient', lazy=True)
    
    def to_dict(self):
        return {
            'ingredient_id': self.ingredient_id,
            'name': self.ingredient.name if self.ingredient else None,
            'unit': self.ingredient.unit if self.ingredient else None,
            'quantity': float(self.quantity) if self.quantity else None
        }


class MealPlan(db.Model):
    """Modelo de planificador semanal"""
    __tablename__ = 'meal_plan'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    plan_date = db.Column(db.Date, nullable=False)
    meal_time = db.Column(db.Enum('Desayuno', 'Comida', 'Cena'), nullable=False)
    
    # Relaciones
    recipe = db.relationship('Recipe', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'recipe_id': self.recipe_id,
            'plan_date': self.plan_date.isoformat() if self.plan_date else None,
            'meal_time': self.meal_time,
            'recipe': self.recipe.to_dict(include_author=False) if self.recipe else None
        }


class Follow(db.Model):
    """Modelo de seguidores"""
    __tablename__ = 'follows'
    
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    followed_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class Review(db.Model):
    """Modelo de valoraciones y comentarios"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    rating = db.Column(db.SmallInteger)  # 1-5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relación con usuario
    user = db.relationship('User', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'recipe_id': self.recipe_id,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Like(db.Model):
    """Modelo de likes en recetas"""
    __tablename__ = 'likes'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), primary_key=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class RecipeCollection(db.Model):
    """Modelo para colecciones de recetas (Libros)"""
    __tablename__ = 'recipe_collections'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relación M:N con recetas a través de una tabla intermedia
    recipes = db.relationship('Recipe', secondary='collection_recipes', lazy='subquery',
        backref=db.backref('collections', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'recipe_count': len(self.recipes),
            'recipes': [r.to_dict(include_author=True) for r in self.recipes]
        }


# Tabla intermedia para Colecciones <-> Recetas
collection_recipes = db.Table('collection_recipes',
    db.Column('collection_id', db.Integer, db.ForeignKey('recipe_collections.id'), primary_key=True),
    db.Column('recipe_id', db.Integer, db.ForeignKey('recipes.id'), primary_key=True)
)


class ShoppingList(db.Model):
    """Modelo para lista de compra manual (adicional a la automática)"""
    __tablename__ = 'shopping_list'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String(50))
    is_checked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'item_name': self.item_name,
            'quantity': self.quantity,
            'is_checked': self.is_checked
        }
