"""
Blueprint de rutas para recetas
GET /api/recipes - Lista todas las recetas (con filtros avanzados)
POST /api/recipes - Crea una receta (requiere autenticación)
GET /api/recipes/<id> - Obtiene una receta específica
POST /api/recipes/<id>/like - Dar/Quitar like
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy import func, desc
from datetime import datetime
from models import db, Recipe, User, Like, RecipeIngredient, Ingredient, Follow

recipes_bp = Blueprint('recipes', __name__)


@recipes_bp.route('/', methods=['GET'])
def get_recipes():
    """
    Obtiene lista de recetas con filtros avanzados y ordenamiento
    
    Query params:
    - category: filtra por categoría
    - search: busca en título
    - author_id: filtra por autor
    - difficulty: filtra por dificultad
    - ingredients: lista separada por comas de ingredientes requeridos
    - sort: 'newest' (defecto), 'likes', 'following'
    """
    # Obtener parámetros
    category = request.args.get('category')
    search = request.args.get('search')
    author_id = request.args.get('author_id')
    difficulty = request.args.get('difficulty')
    ingredients = request.args.get('ingredients')
    sort = request.args.get('sort', 'newest')
    
    query = Recipe.query
    
    # Filtros básicos
    if category:
        query = query.filter(Recipe.category == category)
    if search:
        query = query.filter(Recipe.title.ilike(f'%{search}%'))
    if author_id:
        query = query.filter(Recipe.author_id == int(author_id))
    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)
        
    # Filtro por ingredientes (encuesta/despensa)
    if ingredients:
        ing_list = [i.strip() for i in ingredients.split(',')]
        if ing_list:
            # Subquery para encontrar recetas que tienen AL MENOS UNO de los ingredientes
            # Ojo: para "todos" los ingredientes sería más complejo (intersection)
            query = query.join(RecipeIngredient).join(Ingredient).filter(Ingredient.name.in_(ing_list))
    
    # Ordenamiento
    if sort == 'likes':
        # Left outer join con likes para contar
        subquery = db.session.query(
            Like.recipe_id, 
            func.count('*').label('like_count')
        ).group_by(Like.recipe_id).subquery()
        
        query = query.outerjoin(subquery, Recipe.id == subquery.c.recipe_id).order_by(desc('like_count'))
        
    elif sort == 'following':
        # Requiere auth opcional
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id:
                # Subquery de usuarios seguidos
                followed_subquery = db.session.query(Follow.followed_id).filter(Follow.follower_id == current_user_id).subquery()
                query = query.filter(Recipe.author_id.in_(followed_subquery)).order_by(Recipe.created_at.desc())
            else:
                # Si no está logueado, fallback a newest
                query = query.order_by(Recipe.created_at.desc())
        except:
            query = query.order_by(Recipe.created_at.desc())
            
    else: # newest
        query = query.order_by(Recipe.created_at.desc())
    
    # Ejecutar
    recipes = query.all()
    
    # Eliminar duplicados si el join de ingredientes trajo múltiples filas por receta
    recipes = list({r.id: r for r in recipes}.values())
    
    return jsonify([r.to_dict() for r in recipes])


@recipes_bp.route('/<int:recipe_id>', methods=['GET'])
@jwt_required(optional=True)
def get_recipe(recipe_id):
    """Obtiene una receta específica por ID"""
    recipe = Recipe.query.get_or_404(recipe_id)
    current_user_id = get_jwt_identity()
    
    recipe_data = recipe.to_dict()
    recipe_data['ingredients'] = [ri.to_dict() for ri in recipe.ingredients]
    recipe_data['reviews'] = [r.to_dict() for r in recipe.reviews]
    
    is_liked = False
    if current_user_id:
        existing_like = Like.query.filter_by(user_id=current_user_id, recipe_id=recipe_id).first()
        if existing_like:
            is_liked = True
            
    recipe_data['is_liked'] = is_liked
    
    return jsonify(recipe_data)


@recipes_bp.route('/', methods=['POST'])
@jwt_required()
def create_recipe():
    """Crea una nueva receta con soporte para imágenes y videos"""
    import os
    from werkzeug.utils import secure_filename
    from flask import current_app
    import sys

    print("DEBUG: create_recipe endpoint hit", file=sys.stderr, flush=True)
    print(f"DEBUG: Headers: {request.headers}", file=sys.stderr, flush=True)
    print(f"DEBUG: Content-Type: {request.content_type}", file=sys.stderr, flush=True)

    current_user_id = get_jwt_identity()
    print(f"DEBUG: User ID: {current_user_id}", file=sys.stderr, flush=True)
    
    # Check if request has files or is just JSON
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form
        files = request.files
        print("DEBUG: Processing as multipart/form-data", file=sys.stderr, flush=True)
        print(f"DEBUG: Form Data: {data}", file=sys.stderr, flush=True)
        print(f"DEBUG: Files: {files}", file=sys.stderr, flush=True)
    else:
        data = request.get_json()
        files = {}
        print("DEBUG: Processing as JSON", file=sys.stderr, flush=True)
        print(f"DEBUG: JSON Data: {data}", file=sys.stderr, flush=True)

    try:
        if not data.get('title') or not data.get('instructions'):
            return jsonify({'error': 'Título e instrucciones son requeridos'}), 400

        # Handle File Uploads
        main_image_url = data.get('main_image_url')
        video_url = data.get('video_url')
        
        # Ensure uploads directory exists
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        if 'main_image' in files:
            file = files['main_image']
            if file and file.filename:
                filename = secure_filename(f"{current_user_id}_{int(datetime.utcnow().timestamp())}_{file.filename}")
                file.save(os.path.join(upload_folder, filename))
                main_image_url = f"/static/uploads/{filename}"

        if 'video' in files:
            file = files['video']
            if file and file.filename:
                # Basic validation for video could go here
                filename = secure_filename(f"vid_{current_user_id}_{int(datetime.utcnow().timestamp())}_{file.filename}")
                file.save(os.path.join(upload_folder, filename))
                video_url = f"/static/uploads/{filename}"
        
        new_recipe = Recipe(
            title=data['title'],
            description=data.get('description', ''),
            instructions=data['instructions'],
            category=data.get('category'),
            video_url=video_url,
            main_image_url=main_image_url,
            difficulty=data.get('difficulty', 'Media'),
            prep_time=data.get('prep_time', 0),
            calories=data.get('calories', 0),
            author_id=current_user_id
        )
        
        db.session.add(new_recipe)
        db.session.flush() # Get ID for new_recipe

        # Process Ingredients
        import json
        from models import Ingredient, RecipeIngredient
        
        ingredients_json = data.get('ingredients')
        if ingredients_json:
            try:
                ingredients_list = json.loads(ingredients_json)
                print(f"DEBUG: Ingredients parsed: {ingredients_list}", file=sys.stderr, flush=True)
                
                for ing_data in ingredients_list:
                    name = ing_data.get('name', '').strip()
                    qty_str = ing_data.get('quantity', '0')
                    
                    if not name:
                        continue
                        
                    # Find or create ingredient (Master table)
                    ingredient = Ingredient.query.filter_by(name=name).first()
                    if not ingredient:
                        ingredient = Ingredient(name=name, unit='ud') # Default unit Spanish
                        db.session.add(ingredient)
                        db.session.flush()
                        
                    # Clean quantity string to number if possible, or store as is? 
                    # Model expects Numeric(10,2). We need to extract number.
                    # Simple regex for now or just force float
                    import re
                    # Extract number and unit
                    # Looks for number at start, then optional space and unit
                    match = re.search(r"^([-+]?\d*\.?\d+)\s*([a-zA-ZñÑ]*)$", qty_str.strip())
                    
                    if match:
                        qty_val = float(match.group(1))
                        unit_str = match.group(2).lower() if match.group(2) else 'ud'
                    else:
                         # Fallback for just number
                        qty_match = re.search(r"[-+]?\d*\.\d+|\d+", qty_str)
                        qty_val = float(qty_match.group()) if qty_match else 0
                        unit_str = 'ud'

                    # Clean unit strings (optional normalization)
                    if unit_str in ['g', 'gr', 'gramos']: unit_str = 'g'
                    if unit_str in ['kg', 'kilos']: unit_str = 'kg'
                    if unit_str in ['ml', 'mililitros']: unit_str = 'ml'
                    if unit_str in ['l', 'litros']: unit_str = 'L'
                    
                    # Link to Recipe
                    recipe_ing = RecipeIngredient(
                        recipe_id=new_recipe.id,
                        ingredient_id=ingredient.id,
                        quantity=qty_val
                    )
                    db.session.add(recipe_ing)
                    
                    # Update or Set Unit on Ingredient
                    # WARNING: Simple valid logic - if ingredient has generic unit, update it.
                    # If it has specific unit, we trust the DB (limitation: no conversion)
                    if ingredient.unit == 'unit' or ingredient.unit == 'ud':
                        ingredient.unit = unit_str
                        db.session.add(ingredient) # Mark for update
                    db.session.add(recipe_ing)
                    
            except Exception as e:
                print(f"ERROR processing ingredients: {e}", file=sys.stderr, flush=True)
                # Don't fail the whole recipe creation? Or do we?
                # For now let's just log and continue
        
        db.session.commit()
        
        # Return full recipe including ingredients
        recipe_data = new_recipe.to_dict()
        recipe_data['ingredients'] = [ri.to_dict() for ri in new_recipe.ingredients]
        return jsonify(recipe_data), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@recipes_bp.route('/<int:recipe_id>', methods=['PUT'])
@jwt_required()
def update_recipe(recipe_id):
    """Actualiza una receta"""
    current_user_id = get_jwt_identity()
    recipe = Recipe.query.get_or_404(recipe_id)

    # Check permissions: Owner OR Admin
    # Ensure current_user_id is int for comparison
    try:
        user_id_int = int(current_user_id)
    except:
        user_id_int = -1
        
    current_user = User.query.get(user_id_int)
    is_admin = current_user.rol == 'admin' if current_user else False

    if recipe.author_id != user_id_int and not is_admin:
        return jsonify({'error': 'No autorizado'}), 403
    
    data = request.get_json()
    
    fields = ['title', 'description', 'instructions', 'category', 'video_url', 'main_image_url', 'difficulty', 'prep_time', 'calories']
    for field in fields:
        if field in data:
            setattr(recipe, field, data[field])
    
    db.session.commit()
    
    # Update Ingredients if provided
    if 'ingredients' in data:
        try:
            import json
            from models import Ingredient, RecipeIngredient
            import sys
            
            # Clear existing ingredients
            RecipeIngredient.query.filter_by(recipe_id=recipe.id).delete()
            
            ingredients_json = data['ingredients']
            # If it comes as string (form-data style) or list (json style)
            if isinstance(ingredients_json, str):
                ingredients_list = json.loads(ingredients_json)
            else:
                ingredients_list = ingredients_json
                
            print(f"DEBUG: Updating ingredients: {ingredients_list}", file=sys.stderr, flush=True)

            for ing_data in ingredients_list:
                name = ing_data.get('name', '').strip()
                qty_str = str(ing_data.get('quantity', '0'))
                
                if not name:
                    continue
                    
                # Find or create ingredient (Master table)
                ingredient = Ingredient.query.filter_by(name=name).first()
                if not ingredient:
                    ingredient = Ingredient(name=name, unit='ud')
                    db.session.add(ingredient)
                    db.session.flush()
                    
                # Parse quantity loop (reuse logic from create or simplified)
                import re
                match = re.search(r"^([-+]?\d*\.?\d+)\s*([a-zA-ZñÑ]*)$", qty_str.strip())
                
                if match:
                    qty_val = float(match.group(1))
                    unit_str = match.group(2).lower() if match.group(2) else 'ud'
                else:
                    qty_match = re.search(r"[-+]?\d*\.\d+|\d+", qty_str)
                    qty_val = float(qty_match.group()) if qty_match else 0
                    unit_str = 'ud'

                # Clean unit strings
                if unit_str in ['g', 'gr', 'gramos']: unit_str = 'g'
                if unit_str in ['kg', 'kilos']: unit_str = 'kg'
                if unit_str in ['ml', 'mililitros']: unit_str = 'ml'
                if unit_str in ['l', 'litros']: unit_str = 'L'
                if unit_str in ['oz', 'ounce', 'ounces']: unit_str = 'oz'
                if unit_str in ['lb', 'pound', 'pounds']: unit_str = 'lb'
                
                # Link to Recipe
                recipe_ing = RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient.id,
                    quantity=qty_val
                )
                db.session.add(recipe_ing)
                
                # Update unit if generic
                if ingredient.unit == 'unit' or ingredient.unit == 'ud':
                    ingredient.unit = unit_str
                    db.session.add(ingredient)

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"ERROR updating ingredients: {e}", file=sys.stderr, flush=True)
            return jsonify({'error': str(e)}), 500

    # Return full recipe including ingredients
    recipe_data = recipe.to_dict()
    recipe_data['ingredients'] = [ri.to_dict() for ri in recipe.ingredients]
    return jsonify(recipe_data)


@recipes_bp.route('/<int:recipe_id>', methods=['DELETE'])
@jwt_required()
def delete_recipe(recipe_id):
    """Elimina una receta (Dueño o Admin)"""
    current_user_id = get_jwt_identity()
    recipe = Recipe.query.get_or_404(recipe_id)
    
    # Check permissions: Owner OR Admin
    try:
        user_id_int = int(current_user_id)
    except:
        user_id_int = -1
        
    current_user = User.query.get(user_id_int)
    
    # Assuming 'rol' is the field name for role, and 'admin' is the value
    is_admin = current_user.rol == 'admin' if current_user else False
    
    if recipe.author_id != user_id_int and not is_admin:
        return jsonify({'error': 'No autorizado'}), 403
    
    db.session.delete(recipe)
    db.session.commit()
    return jsonify({'message': 'Receta eliminada'})


@recipes_bp.route('/<int:recipe_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(recipe_id):
    """Dar o quitar like a una receta"""
    current_user_id = get_jwt_identity()
    recipe = Recipe.query.get_or_404(recipe_id)
    
    existing_like = Like.query.filter_by(user_id=current_user_id, recipe_id=recipe_id).first()
    
    if existing_like:
        db.session.delete(existing_like)
        action = 'unliked'
    else:
        new_like = Like(user_id=current_user_id, recipe_id=recipe_id)
        db.session.add(new_like)
        action = 'liked'
        
    db.session.commit()
    
    # Recalcular total
    likes_count = Like.query.filter_by(recipe_id=recipe_id).count()
    
    return jsonify({
        'action': action,
        'likes_count': likes_count
    })
