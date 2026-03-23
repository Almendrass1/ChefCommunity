import React from 'react';

interface Recipe {
    id: number;
    title: string;
    author?: string;
    main_image_url?: string;
    video_url?: string;
    category?: string;
    difficulty?: 'Fácil' | 'Media' | 'Difícil';
    prep_time?: number;
    likes_count?: number;
    missing_ingredients?: string[];
    is_complete?: boolean;
    [key: string]: any;
}


interface RecipeCardProps {
    recipe: Recipe;
    onClick?: () => void;
    showAuthor?: boolean;
    showWarnings?: boolean;
    children?: React.ReactNode;
}

/**
 * RecipeCard - Componente de tarjeta de receta con estética retro 70s/80s
 */
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, showAuthor = true, showWarnings = false, children }) => {
    const {
        title,
        author,
        main_image_url,
        video_url,
        category,
        difficulty,
        prep_time
    } = recipe;

    // Placeholder para imagen si no hay URL
    const imageUrl = main_image_url || 'https://placehold.co/400x300/F5E6D3/5C4033?text=Sin+Imagen';

    // Color del badge de dificultad (Neutral Gray)
    const difficultyColors: Record<string, string> = {
        'Fácil': 'bg-gray-100 text-gray-600',
        'Media': 'bg-gray-200 text-gray-700',
        'Difícil': 'bg-gray-800 text-white'
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <article
            className={`flex flex-col h-full bg-white overflow-hidden animate-fade-in-up group transition-all duration-300 ${onClick ? 'cursor-pointer hover:translate-y-[-4px]' : ''}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            tabIndex={onClick ? 0 : undefined}
            role={onClick ? "button" : "article"}
        >
            {/* Imagen de la receta */}
            <div className="relative overflow-hidden shrink-0">
                {children}
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/F5E6D3/5C4033?text=Sin+Imagen';
                    }}
                />

                {/* Badge VHS si tiene video */}
                {video_url && (
                    <span className="vhs-badge absolute top-3 right-3 shadow-lg">
                        VHS
                    </span>
                )}

                {/* Categoría */}
                {category && (
                    <span className="absolute bottom-3 left-3 bg-white/90 text-gray-800 px-3 py-1 rounded-md text-xs font-bold shadow-md backdrop-blur-sm">
                        {category}
                    </span>
                )}

                {/* Missing Ingredients Warning */}
                {showWarnings && recipe.missing_ingredients !== undefined && (
                    <div className={`absolute inset-x-0 bottom-0 p-3 pt-6 bg-linear-to-t from-black/80 to-transparent backdrop-blur-sm transition-all duration-300 ${recipe.is_complete ? 'translate-y-full group-hover:translate-y-0' : 'translate-y-0'}`}>
                        {recipe.is_complete ? (
                            <div className="flex items-center gap-2 text-retro-green font-bold text-[10px] uppercase tracking-widest">
                                <span translate="no" className="material-symbols-outlined notranslate text-sm fill-current">check_circle</span>
                                ¡Tienes todo en tu despensa!
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-amber-400 font-bold text-[10px] uppercase tracking-widest">
                                    <span translate="no" className="material-symbols-outlined notranslate text-sm">warning</span>
                                    Te falta:
                                </div>
                                <p className="text-white text-[10px] font-medium leading-tight line-clamp-1 italic">
                                    {recipe.missing_ingredients.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Contenido de la card */}
            <div className="p-5 flex flex-col grow">
                {/* Título */}
                <h3 className="text-display text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {title}
                </h3>

                {/* Autor */}
                {showAuthor && (
                    <p className="text-body text-gray-400 text-xs mb-4">
                        Por: <span className="font-bold text-gray-600 italic">{author || 'Anónimo'}</span>
                    </p>
                )}

                {/* Spacer to push metadata to bottom */}
                <div className="grow"></div>

                {/* Metadatos */}
                <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-4 mt-auto">
                    {/* Tiempo de preparación */}
                    {prep_time && (
                        <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                            <span translate="no" className="material-symbols-outlined notranslate text-sm">schedule</span>
                            {prep_time} min
                        </span>
                    )}

                    {/* Social Metrics */}
                    <div className="flex items-center gap-4">
                        {/* Rating */}
                        <div className="flex items-center gap-1.5 text-gray-400 font-bold">
                            <span translate="no" className={`material-symbols-outlined notranslate text-sm ${recipe.avg_rating > 0 ? 'text-amber-400 fill-current' : ''}`}>star</span>
                            <span>{recipe.avg_rating > 0 ? recipe.avg_rating : '-'}</span>
                        </div>

                    </div>

                    {/* Dificultad */}
                    {difficulty && (
                        <span className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-black ${difficultyColors[difficulty] || 'bg-gray-800 text-white'}`}>
                            {difficulty}
                        </span>
                    )}
                </div>
            </div>
        </article >
    );
};

export default RecipeCard;
