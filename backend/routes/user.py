"""
Blueprint de usuarios
Perfil, Seguidores, Plan Semanal, Colecciones
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Recipe, Follow, Like, RecipeCollection, MealPlan, ShoppingList, RecipeIngredient, UserStock, collection_recipes

user_bp = Blueprint('users', __name__)

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required(optional=True)
def get_profile(user_id):
    """Obtiene perfil público de usuario con sus recetas"""
    try:
        user = User.query.get_or_404(user_id)
        current_user_id = get_jwt_identity()
        
        is_following = False
        if current_user_id:
             follow = Follow.query.filter_by(follower_id=current_user_id, followed_id=user_id).first()
             if follow:
                 is_following = True

        # Obtener recetas publicadas
        recipes = Recipe.query.filter_by(author_id=user_id).order_by(Recipe.created_at.desc()).all()
        
        return jsonify({
            'user': user.to_dict(),
            'is_following': is_following,
            'recipes': [r.to_dict(include_author=False) for r in recipes],
            'collections': [c.to_dict() for c in user.collections]
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@user_bp.route('/me/likes', methods=['GET'])
@jwt_required()
def get_liked_recipes():
    """Obtener recetas que le gustan al usuario actual"""
    current_user_id = get_jwt_identity()
    
    # Usamos un join implícito o iteramos. 
    # Dado que Like tiene backref='recipe' en Recipe, Like objects tienen .recipe
    likes = Like.query.filter_by(user_id=current_user_id).order_by(Like.created_at.desc()).all()
    
    recipes_data = []
    for like in likes:
        if like.recipe:
            recipes_data.append(like.recipe.to_dict(include_author=True))
            
    return jsonify(recipes_data)


@user_bp.route('/<int:user_id>/follow', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    """Seguir o dejar de seguir a un usuario"""
    current_user_id = get_jwt_identity()
    if current_user_id == user_id:
        return jsonify({'error': 'No puedes seguirte a ti mismo'}), 400
        
    follow = Follow.query.filter_by(follower_id=current_user_id, followed_id=user_id).first()
    
    if follow:
        db.session.delete(follow)
        action = 'unfollowed'
    else:
        new_follow = Follow(follower_id=current_user_id, followed_id=user_id)
        db.session.add(new_follow)
        action = 'followed'
        
    db.session.commit()
    return jsonify({'action': action, 'user_id': user_id})


@user_bp.route('/me/meal-plan', methods=['GET', 'POST'])
@jwt_required()
def manage_meal_plan():
    """Gestionar planificador semanal"""
    current_user_id = get_jwt_identity()
    
    if request.method == 'GET':
        plans = MealPlan.query.filter_by(user_id=current_user_id).order_by(MealPlan.plan_date).all()
        return jsonify([p.to_dict() for p in plans])
        
    if request.method == 'POST':
        data = request.get_json()
        new_plan = MealPlan(
            user_id=current_user_id,
            recipe_id=data['recipe_id'],
            plan_date=data['plan_date'],
            meal_time=data['meal_time']
        )
        db.session.add(new_plan)
        db.session.commit()
        return jsonify(new_plan.to_dict()), 201


@user_bp.route('/me/meal-plan/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_meal_plan_item(plan_id):
    """Eliminar ítem del planificador"""
    current_user_id = get_jwt_identity()
    plan = MealPlan.query.filter_by(id=plan_id, user_id=current_user_id).first_or_404()
    
    db.session.delete(plan)
    db.session.commit()
    return jsonify({'message': 'Plan eliminada'}), 200


@user_bp.route('/me/collections', methods=['GET', 'POST'])
@jwt_required()
def manage_collections():
    """Gestionar libros de recetas"""
    current_user_id = get_jwt_identity()
    
    if request.method == 'GET':
        collections = RecipeCollection.query.filter_by(user_id=current_user_id).all()
        return jsonify([c.to_dict() for c in collections])
        
    if request.method == 'POST':
        data = request.get_json()
        new_collection = RecipeCollection(
            user_id=current_user_id,
            name=data['name'],
            description=data.get('description', '')
        )
        db.session.add(new_collection)
        db.session.commit()
        return jsonify(new_collection.to_dict()), 201


@user_bp.route('/me/collections/<int:collection_id>/add/<int:recipe_id>', methods=['POST'])
@jwt_required()
def add_to_collection(collection_id, recipe_id):
    """Añadir receta a una colección"""
    current_user_id = get_jwt_identity()
    collection = RecipeCollection.query.filter_by(id=collection_id, user_id=current_user_id).first_or_404()
    recipe = Recipe.query.get_or_404(recipe_id)
    
    if recipe not in collection.recipes:
        collection.recipes.append(recipe)
        db.session.commit()
        
    return jsonify(collection.to_dict())


@user_bp.route('/me/collections/<int:collection_id>/recipes/<int:recipe_id>', methods=['DELETE'])
@jwt_required()
def remove_from_collection(collection_id, recipe_id):
    """Eliminar receta de una colección"""
    current_user_id = get_jwt_identity()
    collection = RecipeCollection.query.filter_by(id=collection_id, user_id=current_user_id).first_or_404()
    recipe = Recipe.query.get_or_404(recipe_id)
    
    if recipe in collection.recipes:
        collection.recipes.remove(recipe)
        db.session.commit()
        
    return jsonify(collection.to_dict())


@user_bp.route('/me/shopping-list/generate', methods=['POST'])
@jwt_required()
def generate_shopping_list():
    """Generar lista de compra basada en plan semanal - stock"""
    current_user_id = get_jwt_identity()
    
    # 1. Obtener recetas planificadas (próximos 7 días por defecto)
    meal_plans = MealPlan.query.filter_by(user_id=current_user_id).all()
    
    needed_ingredients = {}
    
    print(f"DEBUG: Meal Plans count: {len(meal_plans)}")
    # 2. Sumar ingredientes necesarios
    for plan in meal_plans:
        print(f"DEBUG: Plan Recipe: {plan.recipe.title}")
        for ri in plan.recipe.ingredients:
            print(f"DEBUG: - Ing: {ri.ingredient.name}, Qty: {ri.quantity}, Unit: {ri.ingredient.unit}")
            if ri.ingredient_id in needed_ingredients:
                needed_ingredients[ri.ingredient_id]['qty'] += float(ri.quantity)
            else:
                needed_ingredients[ri.ingredient_id] = {
                    'name': ri.ingredient.name,
                    'qty': float(ri.quantity),
                    'unit': ri.ingredient.unit
                }
    
    # 3. Restar stock del usuario
    user_stock = UserStock.query.filter_by(user_id=current_user_id).all()
    for stock in user_stock:
        if stock.ingredient_id in needed_ingredients:
             needed_ingredients[stock.ingredient_id]['qty'] -= float(stock.quantity)
    
    # 4. Generar lista final (solo positivos)
    shopping_list = []
    for ing_id, data in needed_ingredients.items():
        if data['qty'] > 0:
            # Metric Conversion Logic
            unit = data['unit'] if data['unit'] else 'ud'
            qty = data['qty']
            print(f"DEBUG: Converting {data['name']}: {qty} {unit}")
            
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
            
            # Formatting
            qty_display = round(qty, 2) if qty % 1 else int(qty)
            
            shopping_list.append({
                'name': data['name'],
                'quantity': f"{qty_display} {unit}",
                'status': 'needed'
            })
            
            # Opcional: Guardar en tabla ShoppingList persistente
            # item = ShoppingList(user_id=current_user_id, item_name=data['name'], quantity=f"{data['qty']} {data['unit']}")
            # db.session.add(item)
    
    # db.session.commit()
    return jsonify(shopping_list)
