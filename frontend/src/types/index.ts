export interface User {
    id: number;
    username: string;
    email: string;
    rol: 'aprendiz' | 'saludable' | 'chef' | 'admin' | 'dueño';
    bio?: string;
    avatar_url?: string;
    followers_count: number;
    following_count: number;
}

export interface Ingredient {
    id: number;
    name: string;
    unit: string;
}

export interface RecipeIngredient {
    ingredient: Ingredient;
    quantity: number;
}

export interface Recipe {
    id: number;
    title: string;
    description?: string;
    instructions: string | any[];
    category?: string;
    video_url?: string;
    main_image_url?: string;
    image_url?: string;
    difficulty?: 'Fácil' | 'Media' | 'Difícil';
    prep_time?: number;
    calories?: number;
    author_id: number;
    author?: string;
    author_avatar?: string;
    likes_count: number;
    is_liked?: boolean;
    created_at: string;
    ingredients?: RecipeIngredient[];
}

export interface MealPlan {
    id: number;
    recipe_id: number;
    recipe?: Recipe;
    plan_date: string;
    meal_time: string;
}

export interface Collection {
    id: number;
    name: string;
    description?: string;
    recipe_count: number;
    recipes?: Recipe[];
}
