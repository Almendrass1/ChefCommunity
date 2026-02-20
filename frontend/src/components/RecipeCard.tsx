import React from 'react';

interface Recipe {
    title: string;
    author?: string;
    main_image_url?: string;
    video_url?: string;
    category?: string;
    difficulty?: 'Fácil' | 'Media' | 'Difícil';
    prep_time?: number;
    [key: string]: any;
}

interface RecipeCardProps {
    recipe: Recipe;
}

/**
 * RecipeCard - Componente de tarjeta de receta con estética retro 70s/80s
 */
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
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

    // Color del badge de dificultad
    const difficultyColors: Record<string, string> = {
        'Fácil': 'bg-olive text-cream',
        'Media': 'bg-mustard text-chocolate',
        'Difícil': 'bg-rust text-cream'
    };

    return (
        <article className="card-retro animate-fade-in-up group">
            {/* Imagen de la receta */}
            <div className="relative overflow-hidden">
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
                    <span className="vhs-badge absolute top-3 right-3">
                        VHS
                    </span>
                )}

                {/* Categoría */}
                {category && (
                    <span className="absolute bottom-3 left-3 bg-cream/90 text-chocolate px-3 py-1 rounded-md text-sm font-body font-bold border-2 border-chocolate">
                        {category}
                    </span>
                )}
            </div>

            {/* Contenido de la card */}
            <div className="p-4">
                {/* Título */}
                <h3 className="text-display text-xl font-bold text-chocolate mb-2 line-clamp-2">
                    {title}
                </h3>

                {/* Autor */}
                <p className="text-body text-chocolate-light text-sm mb-3">
                    Por: <span className="font-bold text-burnt-orange">{author || 'Anónimo'}</span>
                </p>

                {/* Metadatos */}
                <div className="flex items-center justify-between text-sm">
                    {/* Tiempo de preparación */}
                    {prep_time && (
                        <span className="flex items-center gap-1 text-chocolate">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {prep_time} min
                        </span>
                    )}

                    {/* Dificultad */}
                    {difficulty && (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${difficultyColors[difficulty] || 'bg-chocolate text-cream'}`}>
                            {difficulty}
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
};

export default RecipeCard;
