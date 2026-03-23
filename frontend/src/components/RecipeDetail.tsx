import React, { useReducer, useEffect, useMemo, useCallback } from 'react';
import AddToMealPlanModal from './AddToMealPlanModal';
import ConfirmationModal from './ConfirmationModal';
import IngredientList from './IngredientList';
import InstructionSteps from './InstructionSteps';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

interface RecipeDetailProps {
    recipe?: any;
    token: string | null;
    user?: any;
    onAuthorClick?: (author: any) => void;
    onEdit?: () => void;
}

type State = {
    localRecipe: any;
    isLiked: boolean;
    loading: boolean;
    submittingReview: boolean;
    newRating: number;
    newComment: string;
    newPhoto: File | null;
    photoPreview: string | null;
    isPlanModalOpen: boolean;
    deleteModalOpen: boolean;
};

type Action = 
    | { type: 'SET_RECIPE'; payload: any }
    | { type: 'TOGGLE_LIKE'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_SUBMITTING_REVIEW'; payload: boolean }
    | { type: 'RESET_REVIEW_FORM' }
    | { type: 'UPDATE_FIELD'; field: keyof State; value: any }
    | { type: 'SET_PLAN_MODAL'; payload: boolean }
    | { type: 'SET_DELETE_MODAL'; payload: boolean };

const initialState: State = {
    localRecipe: null,
    isLiked: false,
    loading: false,
    submittingReview: false,
    newRating: 0,
    newComment: '',
    newPhoto: null,
    photoPreview: null,
    isPlanModalOpen: false,
    deleteModalOpen: false,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_RECIPE':
            return {
                ...state,
                localRecipe: action.payload,
                isLiked: !!action.payload.is_liked,
                loading: false
            };
        case 'TOGGLE_LIKE':
            return { ...state, isLiked: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_SUBMITTING_REVIEW':
            return { ...state, submittingReview: action.payload };
        case 'UPDATE_FIELD':
            return { ...state, [action.field]: action.value };
        case 'RESET_REVIEW_FORM':
            return {
                ...state,
                newComment: '',
                newRating: 0,
                newPhoto: null,
                photoPreview: null
            };
        case 'SET_PLAN_MODAL':
            return { ...state, isPlanModalOpen: action.payload };
        case 'SET_DELETE_MODAL':
            return { ...state, deleteModalOpen: action.payload };
        default:
            return state;
    }
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, token, user, onAuthorClick, onEdit }) => {
    const [state, dispatch] = useReducer(reducer, {
        ...initialState,
        localRecipe: recipe,
        isLiked: recipe?.is_liked || false,
        loading: !recipe?.ingredients || recipe.ingredients.length === 0
    });

    const {
        localRecipe,
        isLiked,
        loading,
        submittingReview,
        newRating,
        newComment,
        photoPreview,
        isPlanModalOpen,
        deleteModalOpen,
        newPhoto
    } = state;

    const activeRecipe = localRecipe || recipe;
    const title = activeRecipe?.title || "Cargando...";
    const author = activeRecipe?.author || "Chef Anónimo";
    const prep_time = activeRecipe?.prep_time || "--";
    const ingredients = activeRecipe?.ingredients || [];
    const instructions = activeRecipe?.instructions || "";
    const reviews = activeRecipe?.reviews || [];

    const isAuthor = user && recipe && user.id === recipe.author_id;
    const isAdmin = user && user.rol === 'admin';
    const canEditOrDelete = isAuthor || isAdmin;

    const handleAuthorClick = useCallback(() => {
        if (onAuthorClick && activeRecipe?.author_id) {
            onAuthorClick({
                id: activeRecipe.author_id,
                username: activeRecipe.author,
                avatar_url: activeRecipe.author_avatar
            });
        }
    }, [onAuthorClick, activeRecipe]);

    // Derived state for instructions
    const formattedInstructions = useMemo(() => {
        if (typeof instructions === 'string') {
            return instructions.split('\n')
                .filter(line => line.trim() !== '')
                .map((line, i) => ({ step: i + 1, title: `Paso ${i + 1}`, text: line }));
        }
        return [
            {
                title: 'Dorar la Carne',
                text: 'En una sartén grande, calienta aceite de oliva a fuego medio-alto. Añade la cebolla picada y cocina hasta que esté transparente. Añade la carne molida y el ajo. Cocina hasta que la carne esté dorada. Escurre el exceso de grasa.',
                step: 1
            },
            {
                title: 'Cocinar la Salsa',
                text: 'Añade la salsa de tomate, pasta de tomate, albahaca seca, sal y pimienta. Lleva a fuego lento. Reduce el fuego, tapa y deja burbujear suavemente durante al menos 20 minutos. ¡Debe oler como la cocina de una abuela italiana!',
                step: 2,
                tip: 'Añade una pizca de azúcar si la salsa está muy ácida.'
            }
        ];
    }, [instructions]);

    const fetchFullRecipe = useCallback(async (id: number) => {
        if (!id) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`/api/recipes/${id}`, { headers });
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: 'SET_RECIPE', payload: data });
            }
        } catch (err) {
            console.error("Error fetching full recipe", err);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [token]);

    const handleAddToMealPlan = async (date: string, mealTime: string) => {
        if (!token) {
            alert("Debes iniciar sesión para planificar comidas.");
            return;
        }

        try {
            const response = await fetch('/api/users/me/meal-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipe_id: activeRecipe.id,
                    plan_date: date,
                    meal_time: mealTime
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al añadir al plan');
            }

            alert("¡Receta añadida a tu Plan Semanal!");
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDeleteRecipe = async () => {
        if (!token) return;

        try {
            const response = await fetch(`/api/recipes/${activeRecipe.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error || "Error al eliminar receta");
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión");
        }
    };

    const handleToggleLike = async () => {
        if (!token) {
            alert("Por favor inicia sesión para guardar recetas.");
            return;
        }

        try {
            const res = await fetch(`/api/recipes/${activeRecipe.id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                dispatch({ type: 'TOGGLE_LIKE', payload: data.action === 'liked' });
            }
        } catch (error) {
            console.error("Error toggling like", error);
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (newRating === 0) {
            alert("Por favor selecciona una calificación");
            return;
        }

        dispatch({ type: 'SET_SUBMITTING_REVIEW', payload: true });
        try {
            const formData = new FormData();
            formData.append('rating', newRating.toString());
            formData.append('comment', newComment);
            if (newPhoto) {
                formData.append('image', newPhoto);
            }

            const response = await fetch(`/api/recipes/${activeRecipe.id}/reviews`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                dispatch({ type: 'RESET_REVIEW_FORM' });
                fetchFullRecipe(activeRecipe.id);
            } else {
                const data = await response.json();
                alert(data.error || "Error al enviar comentario");
            }
        } catch (error) {
            console.error("Error submitting review", error);
            alert("Error de conexión");
        } finally {
            dispatch({ type: 'SET_SUBMITTING_REVIEW', payload: false });
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            dispatch({ type: 'UPDATE_FIELD', field: 'newPhoto', value: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                dispatch({ type: 'UPDATE_FIELD', field: 'photoPreview', value: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // Sync localRecipe and isLiked if recipe changes
    useEffect(() => {
        if (recipe) {
            dispatch({ type: 'SET_RECIPE', payload: recipe });

            if (!recipe.ingredients || recipe.ingredients.length === 0 || token) {
                fetchFullRecipe(recipe.id);
            }
        }
    }, [recipe, token, fetchFullRecipe]);

    return (
        <div className="grow container mx-auto px-4 py-8 max-w-5xl">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 mb-6 items-center text-sm font-bold uppercase tracking-wider text-[#b9a89d]">
                <a className="hover:text-primary transition-colors" href="/">Inicio</a>
                <span translate="no" className="material-symbols-outlined notranslate text-xs">chevron_right</span>
                <span className="text-primary">{title}</span>
            </nav>

            {/* Simple Hero Image */}
            <div className="relative w-full aspect-video md:aspect-21/9 bg-gray-100 rounded-2xl border-2 border-gray-200 shadow-md overflow-hidden mb-12">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    aria-label={`Close up of ${title}`}
                    role="img"
                    style={{
                        backgroundImage: `url('${activeRecipe?.main_image_url || "https://placehold.co/1200x600/f3f4f6/ec6d13?text=ChefCommunity"}')`,
                        backgroundPosition: 'center 40%'
                    }}
                ></div>
            </div>

            {/* Recipe Header Info */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b-4 border-[#392f28] border-dashed">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-[#3E2723] dark:text-black mb-2 tracking-tight drop-shadow-sm">{title}</h1>
                    <div className="flex items-center gap-4 text-[#5D4037] dark:text-[#b9a89d] font-medium">
                        <button
                            type="button"
                            className={`flex items-center gap-1 ${onAuthorClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                            onClick={handleAuthorClick}
                        >
                            <span translate="no" className="material-symbols-outlined notranslate text-primary">person</span>
                            <span className="font-bold underline decoration-dotted underline-offset-4">{author}</span>
                        </button>
                        <span className="w-1 h-1 bg-current rounded-full" aria-hidden="true"></span>
                        <div className="flex items-center gap-1">
                            <span translate="no" className="material-symbols-outlined notranslate text-primary">schedule</span>
                            <span>{prep_time}m</span>
                        </div>
                        <span className="w-1 h-1 bg-current rounded-full" aria-hidden="true"></span>
                        <div className="flex items-center gap-1">
                            <span translate="no" className="material-symbols-outlined notranslate text-primary">oven_gen</span>
                            <span>1hr</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    {canEditOrDelete && onEdit && (
                        <>
                            <button
                                onClick={onEdit}
                                className="btn-retro bg-[#0d0a08] text-white border-black px-4 py-2 text-[10px] sm:text-xs group"
                            >
                                <span translate="no" className="material-symbols-outlined notranslate text-sm sm:text-base group-hover:rotate-12 transition-transform">edit</span>
                                <span>EDITAR</span>
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'SET_DELETE_MODAL', payload: true })}
                                className="btn-retro bg-[#0d0a08] text-white border-black px-4 py-2 text-[10px] sm:text-xs group hover:bg-red-950 transition-colors"
                            >
                                <span translate="no" className="material-symbols-outlined notranslate text-sm sm:text-base group-hover:scale-110 transition-transform">delete</span>
                                <span>BORRAR</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => dispatch({ type: 'SET_PLAN_MODAL', payload: true })}
                        className="btn-primary px-4 py-2 text-sm group"
                    >
                        <span translate="no" className="material-symbols-outlined notranslate group-hover:scale-110 transition-transform">calendar_month</span>
                        <span>Planificar</span>
                    </button>

                    <button
                        onClick={handleToggleLike}
                        aria-pressed={isLiked}
                        className={`btn-retro px-4 py-2 text-sm group
                        ${isLiked ? 'bg-pink-100 text-pink-600 border-pink-600 shadow-none translate-y-[2px]' : 'bg-white text-black'}`}
                    >
                        <span translate="no" className={`material-symbols-outlined notranslate group-hover:scale-110 transition-transform ${isLiked ? 'text-pink-600 fill-current' : 'text-primary'}`}>
                            {isLiked ? 'heart_broken' : 'favorite'}
                        </span>
                        <span>{isLiked ? 'Guardado' : 'Guardar'}</span>
                    </button>

                    {['print', 'share'].map((icon, index) => (
                        <button key={icon} className="flex items-center gap-2 text-[#ffffff] bg-[#f8f7f6] dark:bg-[#28211d] border-2 border-black dark:border-[#5D4037] px-4 py-2 rounded-lg shadow-retro-sm hover:translate-y-[2px] hover:shadow-none transition-all font-bold uppercase text-sm group">
                            <span translate="no" className="material-symbols-outlined notranslate text-primary group-hover:scale-110 transition-transform">{icon}</span>
                            <span className="text-black dark:text-[#b9a89d]">{['Imprimir', 'Compartir'][index]}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Ingredients */}
                <aside className="lg:col-span-4">
                    <IngredientList ingredients={ingredients} loading={loading} />
                </aside>

                {/* Right Column: Instructions */}
                <main className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold uppercase tracking-wider text-primary border-l-8 border-primary pl-4">Pasos de Preparación</h2>
                    </div>
                    <InstructionSteps steps={activeRecipe?.steps} formattedInstructions={formattedInstructions} />
                </main>
            </div>

            {/* Reviews Section */}
            <section className="mt-20 pt-10 border-t-4 border-[#392f28] border-dashed">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1">
                        <h3 className="text-3xl font-black text-[#181411] mb-8 flex items-center gap-3 italic">
                            <span translate="no" className="material-symbols-outlined notranslate text-primary text-3xl">forum</span>
                            VALORACIONES Y COMENTARIOS
                            <span className="font-mono text-sm font-normal text-gray-400 not-italic">({reviews.length})</span>
                        </h3>
                        <ReviewList reviews={reviews} />
                    </div>

                    <div className="lg:w-96 shrink-0">
                        {token ? (
                            <ReviewForm 
                                submittingReview={submittingReview}
                                newRating={newRating}
                                newComment={newComment}
                                photoPreview={photoPreview}
                                onRatingChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'newRating', value: v })}
                                onCommentChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'newComment', value: v })}
                                onPhotoChange={handlePhotoChange}
                                onRemovePhoto={() => {
                                    dispatch({ type: 'UPDATE_FIELD', field: 'newPhoto', value: null });
                                    dispatch({ type: 'UPDATE_FIELD', field: 'photoPreview', value: null });
                                }}
                                onSubmit={handleReviewSubmit}
                            />
                        ) : (
                            <div className="bg-gray-100 border-4 border-dashed border-gray-300 p-8 rounded-xl text-center flex flex-col items-center justify-center gap-4">
                                <span translate="no" className="material-symbols-outlined notranslate text-4xl text-gray-400">lock</span>
                                <p className="font-bold text-gray-500 uppercase text-xs tracking-widest">Inicia sesión para valorar esta receta</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <AddToMealPlanModal
                isOpen={isPlanModalOpen}
                onClose={() => dispatch({ type: 'SET_PLAN_MODAL', payload: false })}
                onAdd={handleAddToMealPlan}
                recipeTitle={title}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => dispatch({ type: 'SET_DELETE_MODAL', payload: false })}
                title="¿Eliminar Receta?"
                message="Esta acción no se puede deshacer. ¿Seguro que quieres borrar esta cinta para siempre?"
                onConfirm={handleDeleteRecipe}
                type="danger"
                confirmText="Sí, Borrar"
            />
        </div>
    );
};

export default RecipeDetail;
