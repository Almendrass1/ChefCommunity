import React, { useState, useEffect } from 'react';
import AddToMealPlanModal from './AddToMealPlanModal';
import ConfirmationModal from './ConfirmationModal';

interface RecipeDetailProps {
    recipe?: any;
    token: string | null;
    user?: any;
    onAuthorClick?: (author: any) => void;
    onEdit?: () => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, token, user, onAuthorClick, onEdit }) => {
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(recipe?.is_liked || false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Fallback data if recipe is not provided or incomplete
    const title = recipe?.title || "Lasaña Secreta de la Abuela";
    const author = recipe?.author || "Chef Anonimo";
    const prep_time = recipe?.prep_time || "45";
    const video_url = recipe?.video_url; // Used in VHS background if available, else static image
    const ingredients = recipe?.ingredients || [];
    const instructions = recipe?.instructions || "";

    const isAuthor = user && recipe && user.id === recipe.author_id;
    const isAdmin = user && user.rol === 'admin';
    const canEditOrDelete = isAuthor || isAdmin;

    const handleAuthorClick = () => {
        if (onAuthorClick && recipe?.author_id) {
            onAuthorClick({
                id: recipe.author_id,
                username: recipe.author,
                avatar_url: recipe.author_avatar
            });
        }
    };

    // Adapter for instructions if it's a string (from backend)
    const formattedInstructions = typeof instructions === 'string'
        ? instructions.split('\n').filter(line => line.trim() !== '').map((line: any, i: number) => ({ step: i + 1, title: `Paso ${i + 1}`, text: line }))
        : [
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

    const handleAddToMealPlan = async (date: string, mealTime: string) => {
        if (!token) {
            alert("Debes iniciar sesión para planificar comidas.");
            return;
        }

        const response = await fetch('/api/users/me/meal-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                recipe_id: recipe.id,
                plan_date: date,
                meal_time: mealTime
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al añadir al plan');
        }

        alert("¡Receta añadida a tu Plan Semanal!");
    };

    const handleDeleteRecipe = async () => {
        if (!token) return;

        try {
            const response = await fetch(`/api/recipes/${recipe.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Redirect to home or refresh. Since we don't have a router history prop, 
                // we might need to rely on parent callback or reload.
                // ideally onSuccess callback. For now, reload to Home.
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

    // Sync isLiked if recipe changes (e.g. from prop update)
    useEffect(() => {
        if (recipe) {
            setIsLiked(!!recipe.is_liked);
        }
    }, [recipe]);

    const handleToggleLike = async () => {
        if (!token) {
            alert("Por favor inicia sesión para guardar recetas.");
            return;
        }

        try {
            const res = await fetch(`/api/recipes/${recipe.id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setIsLiked(data.action === 'liked');
            }
        } catch (error) {
            console.error("Error toggling like", error);
        }
    };

    return (
        <div className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 mb-6 items-center text-sm font-bold uppercase tracking-wider text-[#b9a89d]">
                <a className="hover:text-primary transition-colors" href="#">Inicio</a>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <a className="hover:text-primary transition-colors" href="#">Cintas</a>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary">{title}</span>
            </div>

            {/* Hero Section: VHS Player */}
            <div className="relative w-full aspect-video bg-vhs-black rounded-xl border-4 border-[#333] shadow-retro-lg overflow-hidden group mb-10">
                {/* Video Background / Thumbnail */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    aria-label={`Close up of ${title}`}
                    style={{ backgroundImage: `url('${recipe?.main_image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAvV4dYKT1hmWyzjMFJl8cptIsxQTaESeV2tu2pOssg22DwyG-duNsczzy36QCnnZ7fHlO2A3sHysgT7zYEkNu8dLLVFiTonBLyIyfDb_NC3CbZ6nbjLzGqzPteALTRtQE02IbSobLXIwUARE0p2_mQxukSRBpruWnsDsxDrl6KxvOv-G1gbDHFjosednqm7slGr32Gpp_xig3By8pUh2GBjxaCT95jCUywPNseeR7OcH7O-5K5Ou3PY34wQlUgn2A_0UWngmQMDEE"}')` }}
                ></div>
                {/* Scanlines Overlay */}
                <div className="scanlines absolute inset-0 z-10 opacity-30"></div>

                {/* Vignette & Noise */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.8)_100%)] z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-10 pointer-events-none mix-blend-overlay"></div>

                {/* VHS UI Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <div className="font-mono text-retro-green text-3xl sm:text-5xl font-bold glitch-text tracking-widest drop-shadow-md">
                            PLAY ►
                        </div>
                        <div className="font-mono text-white/80 text-lg sm:text-xl font-bold tracking-widest bg-black/40 px-3 py-1 rounded">
                            SP MODE
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="font-mono text-white/50 text-sm sm:text-base">
                            CINTA: 04-B<br />
                            GRAB: {author.toUpperCase()}
                        </div>
                        <div className="font-mono text-white/90 text-2xl sm:text-4xl font-bold tracking-widest drop-shadow-md">
                            00:14:32
                        </div>
                    </div>
                </div>

                {/* Big Play Button (Centered) */}
                <div className="absolute inset-0 z-30 flex items-center justify-center group-hover:bg-black/20 transition-all pointer-events-auto cursor-pointer">
                    <button className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/90 text-white border-4 border-white shadow-[0_0_20px_rgba(236,109,19,0.6)] hover:scale-110 hover:bg-primary transition-all duration-300">
                        <span className="material-symbols-outlined text-5xl sm:text-6xl ml-2">play_arrow</span>
                    </button>
                </div>
            </div>

            {/* Recipe Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b-4 border-[#392f28] border-dashed">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-[#3E2723] dark:text-black mb-2 tracking-tight drop-shadow-sm">{title}</h1>
                    <div className="flex items-center gap-4 text-[#5D4037] dark:text-[#b9a89d] font-medium">
                        <div
                            className={`flex items-center gap-1 ${onAuthorClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                            onClick={handleAuthorClick}
                        >
                            <span className="material-symbols-outlined text-primary">person</span>
                            <span className="font-bold underline decoration-dotted underline-offset-4">{author}</span>
                        </div>
                        <span className="w-1 h-1 bg-current rounded-full"></span>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary">schedule</span>
                            <span>{prep_time}m Prep</span>
                        </div>
                        <span className="w-1 h-1 bg-current rounded-full"></span>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary">oven_gen</span>
                            <span>1hr Cocción</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {canEditOrDelete && onEdit && (
                        <>
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 text-[#ffffff] bg-blue-600 hover:bg-blue-700 border-2 border-black dark:border-[#5D4037] px-4 py-2 rounded-lg shadow-retro-sm hover:translate-y-[2px] hover:shadow-none transition-all font-bold uppercase text-sm group"
                            >
                                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">edit</span>
                                <span>Editar</span>
                            </button>
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="flex items-center gap-2 text-[#ffffff] bg-red-600 hover:bg-red-700 border-2 border-black dark:border-[#5D4037] px-4 py-2 rounded-lg shadow-retro-sm hover:translate-y-[2px] hover:shadow-none transition-all font-bold uppercase text-sm group"
                            >
                                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">delete</span>
                                <span>Borrar</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setIsPlanModalOpen(true)}
                        className="flex items-center gap-2 text-[#ffffff] bg-primary hover:bg-[#d95d00] border-2 border-black dark:border-[#5D4037] px-4 py-2 rounded-lg shadow-retro-sm hover:translate-y-[2px] hover:shadow-none transition-all font-bold uppercase text-sm group"
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">calendar_month</span>
                        <span>Planificar</span>
                    </button>

                    {/* Like / Save Button */}
                    <button
                        onClick={handleToggleLike}
                        className={`flex items-center gap-2 border-2 border-black dark:border-[#5D4037] px-4 py-2 rounded-lg shadow-retro-sm hover:translate-y-[2px] hover:shadow-none transition-all font-bold uppercase text-sm group
                        ${isLiked ? 'bg-pink-100 text-pink-600 border-pink-600' : 'bg-[#f8f7f6] dark:bg-[#28211d] text-[#ffffff]'}`}
                    >
                        <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${isLiked ? 'text-pink-600 fill-current' : 'text-primary'}`}>
                            {isLiked ? 'favorite' : 'favorite'}
                        </span>
                        <span className={isLiked ? 'text-pink-600' : 'text-black dark:text-[#b9a89d]'}>{isLiked ? 'Guardado' : 'Guardar'}</span>
                    </button>

                    {['print', 'share'].map((icon, index) => (
                        <button key={icon} className="flex items-center gap-2 text-[#ffffff] bg-[#f8f7f6] dark:bg-[#28211d] border-2 border-black dark:border-[#5D4037] px-4 py-2 rounded-lg shadow-retro-sm hover:translate-y-[2px] hover:shadow-none transition-all font-bold uppercase text-sm group">
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">{icon}</span>
                            <span className="text-black dark:text-[#b9a89d]">{['Imprimir', 'Compartir'][index]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Column: Ingredients (Notepad Style) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-[#fef9c3] text-gray-800 p-1 rounded-sm shadow-retro rotate-[-1deg] transform transition hover:rotate-0 duration-300 relative">
                        {/* Tape effect */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 rotate-1 backdrop-blur-sm border-l border-r border-white/20 shadow-sm z-10"></div>

                        <div className="bg-[image:repeating-linear-gradient(#fef9c3,#fef9c3_31px,#9ca3af_32px)] p-6 min-h-[500px] font-mono relative">
                            {/* Red margin line */}
                            <div className="absolute top-0 bottom-0 left-12 w-[2px] bg-red-300/50"></div>

                            <h3 className="text-2xl font-bold text-[#181411] mb-8 underline decoration-wavy decoration-primary underline-offset-4 pl-8">Ingredientes</h3>

                            <form className="space-y-0 pl-2 relative z-10">
                                {ingredients.length > 0 ? ingredients.map((item: any, i: number) => (
                                    <label key={i} className="flex items-start gap-3 group cursor-pointer h-8 pt-1">
                                        <input className="retro-checkbox w-5 h-5 border-2 border-black rounded-none focus:ring-0 text-primary mt-0.5" type="checkbox" />
                                        <span className="text-lg leading-tight group-hover:text-primary transition-colors decoration-2 group-has-[:checked]:line-through group-has-[:checked]:opacity-50">
                                            {item.name || item} {item.quantity ? `(${item.quantity} ${item.unit})` : ''}
                                        </span>
                                    </label>
                                )) : (
                                    <div className="py-4 text-center font-mono opacity-60 italic text-[#5D4037]">
                                        Receta sin ingredientes registrados.
                                    </div>
                                )}
                            </form>

                            {/* Handwritten note at bottom */}
                            <div className="absolute bottom-6 right-6 font-mono text-[#5D4037] transform -rotate-6 opacity-80 font-bold text-sm">
                                * ¡No olvides el perejil fresco!
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Instructions */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold uppercase tracking-wider text-primary border-l-8 border-primary pl-4">Pasos de Preparación</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Steps */}
                        {formattedInstructions.map((step: any, i: number) => (
                            <div key={i} className="group relative bg-[#3d2a24] text-[#fff8e1] border-2 border-[#181411] dark:border-[#5D4037] rounded-xl p-6 shadow-retro hover:translate-y-[-2px] hover:shadow-retro-lg transition-all duration-300">
                                <div className="absolute -left-3 -top-3 w-10 h-10 bg-primary border-2 border-black text-white font-bold text-xl flex items-center justify-center rounded-lg shadow-sm z-10">
                                    {step.step || i + 1}
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-xl font-bold mb-2 text-[#ff8e3c]">{step.title || `Paso ${i + 1}`}</h4>
                                    <p className="text-[#fff8e1] leading-relaxed font-medium">
                                        {step.text || step}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AddToMealPlanModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                onAdd={handleAddToMealPlan}
                recipeTitle={title}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
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
