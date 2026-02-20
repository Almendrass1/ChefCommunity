import { useState } from 'react';

interface CreateRecipeProps {
    onCancel: () => void;
    onSuccess: (updatedRecipe?: any) => void;
    token: string | null;
    initialRecipe?: any;
}

const CreateRecipe: React.FC<CreateRecipeProps> = ({ onCancel, onSuccess, token, initialRecipe }) => {
    const [title, setTitle] = useState(initialRecipe?.title || '');
    const [description, setDescription] = useState(initialRecipe?.description || '');
    const [instructions, setInstructions] = useState(initialRecipe?.instructions || '');
    const [category, setCategory] = useState(initialRecipe?.category || 'Comida');
    const [prepTime, setPrepTime] = useState(initialRecipe?.prep_time?.toString() || '');
    const [difficulty, setDifficulty] = useState(initialRecipe?.difficulty || 'Media');
    const [calories, setCalories] = useState(initialRecipe?.calories?.toString() || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [video, setVideo] = useState<File | null>(null);

    // Ingredient State
    // initialRecipe.ingredients comes as array of objects {name, quantity, unit, ...}
    // We need to map it to our local state which expects {name, quantity (string)}.
    const [ingredients, setIngredients] = useState<{ name: string, quantity: string }[]>(
        initialRecipe?.ingredients ? initialRecipe.ingredients.map((i: any) => ({
            name: i.name,
            quantity: i.unit && i.unit !== 'ud' ? `${i.quantity} ${i.unit}` : `${i.quantity}`
        })) : []
    );
    const [newIngName, setNewIngName] = useState('');
    const [newIngQty, setNewIngQty] = useState('');

    const handleAddIngredient = () => {
        if (newIngName.trim() && newIngQty.trim()) {
            setIngredients([...ingredients, { name: newIngName.trim(), quantity: newIngQty.trim() }]);
            setNewIngName('');
            setNewIngQty('');
        }
    };

    const handleRemoveIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!token) {
            console.error("DEBUG: Token is missing in CreateRecipe");
            setError('Autenticación perdida. Por favor inicia sesión de nuevo.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('instructions', instructions);
        formData.append('category', category);
        formData.append('prep_time', prepTime); // Backend will cast to int
        formData.append('difficulty', difficulty);
        formData.append('calories', calories); // Backend will cast to int

        // Send ingredients as JSON string
        formData.append('ingredients', JSON.stringify(ingredients));

        if (mainImage) formData.append('main_image', mainImage);
        if (video) formData.append('video', video);

        try {
            const url = initialRecipe ? `/api/recipes/${initialRecipe.id}` : '/api/recipes/';

            let finalResponse;
            if (initialRecipe) {
                // PUT request (JSON only for now as backend doesn't support files in PUT yet)
                finalResponse = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title, description, instructions, category,
                        prep_time: prepTime, difficulty, calories,
                        ingredients,
                        // Allow updating text fields. Images won't be updated.
                        video_url: initialRecipe.video_url, // Keep old one
                        main_image_url: initialRecipe.main_image_url // Keep old one
                    })
                });
            } else {
                // POST request (FormData)
                finalResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
            }

            if (finalResponse.ok) {
                const data = await finalResponse.json();
                onSuccess(data);
            } else {
                const data = await finalResponse.json().catch(() => ({}));
                setError(data.error || `Error ${finalResponse.status}: ${data.message || finalResponse.statusText}`);
            }
        } catch (err: any) {
            setError(err.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white dark:bg-[#221810] border-4 border-black dark:border-[#5D4037] p-8 rounded-xl shadow-retro-lg relative">
                <div className="absolute top-4 right-4">
                    <button onClick={onCancel} className="text-[#5D4037] hover:text-red-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <h2 className="text-3xl font-bold text-primary mb-6 uppercase tracking-tight">
                    {initialRecipe ? 'Editar Cinta' : 'Grabar Nueva Cinta'}
                </h2>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 font-mono text-sm">
                        {error}
                    </div>
                )}

                {initialRecipe && (
                    <div className="mb-4 text-xs font-mono text-orange-600 bg-orange-100 p-2 border border-orange-300 rounded">
                        Nota: La actualización de imágenes no está disponible en este modo rápido.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Título</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:border-primary focus:outline-none"
                            placeholder="Ej: Ramen Picante"
                        />
                    </div>

                    {!initialRecipe && (
                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Foto</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setMainImage(e.target.files ? e.target.files[0] : null)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-[#d95d00]"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Descripción</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:border-primary focus:outline-none h-20"
                            placeholder="Resumen corto..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Categoría</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:border-primary focus:outline-none"
                            >
                                {['Desayuno', 'Comida', 'Cena', 'Snack', 'Postre'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Dificultad</label>
                            <select
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:border-primary focus:outline-none"
                            >
                                {['Fácil', 'Media', 'Difícil'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Tiempo Prep (min)</label>
                            <input
                                type="number"
                                value={prepTime}
                                onChange={e => setPrepTime(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Calorías</label>
                            <input
                                type="number"
                                value={calories}
                                onChange={e => setCalories(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Ingredients Section */}
                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Ingredientes</label>

                        {/* Input Row */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                placeholder="Ingrediente (ej. Harina)"
                                value={newIngName}
                                onChange={e => setNewIngName(e.target.value)}
                                className="flex-grow bg-[#f0f0f0] text-black border-2 border-black p-2 font-mono focus:border-primary focus:outline-none"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                            />
                            <input
                                type="text"
                                placeholder="Cant. (ej. 200g)"
                                value={newIngQty}
                                onChange={e => setNewIngQty(e.target.value)}
                                className="w-1/3 bg-[#f0f0f0] text-black border-2 border-black p-2 font-mono focus:border-primary focus:outline-none"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                            />
                            <button
                                type="button"
                                onClick={handleAddIngredient}
                                className="bg-[#5D4037] text-white px-4 font-bold border-2 border-black hover:bg-primary"
                            >
                                +
                            </button>
                        </div>

                        {/* Ingredients List (Retro Tags) */}
                        <div className="flex flex-wrap gap-2">
                            {ingredients.map((ing, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-[#e0d8d0] border-2 border-[#5D4037] px-3 py-1 rounded-full shadow-[2px_2px_0px_#000]">
                                    <span className="font-serif font-bold text-[#5D4037]">{ing.name}</span>
                                    <span className="font-mono text-xs text-black/60 bg-white/50 px-1 rounded">{ing.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveIngredient(idx)}
                                        className="text-[#5D4037] hover:text-red-600 font-bold ml-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {ingredients.length === 0 && (
                                <span className="text-xs text-gray-500 font-mono italic">Aún no hay ingredientes.</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-base font-bold uppercase tracking-wider mb-2 text-primary dark:text-[#ff8e3c]">Pasos de Preparación</label>
                        <textarea
                            required
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            className="w-full bg-[#3d2a24] text-[#fff8e1] border-2 border-black p-4 font-mono focus:border-primary focus:outline-none h-60 text-lg shadow-inner"
                            placeholder="Paso a paso..."
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 px-4 rounded border-2 border-black uppercase"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary hover:bg-[#d95d00] text-white font-bold py-3 px-4 rounded border-2 border-black uppercase shadow-retro-sm active:translate-y-0.5 active:shadow-none"
                        >
                            {loading ? 'Grabando...' : (initialRecipe ? 'Actualizar Cinta' : 'Publicar Cinta')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRecipe;
