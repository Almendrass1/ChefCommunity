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
    const [category, setCategory] = useState(initialRecipe?.category || 'Comida');
    const [prepTime, setPrepTime] = useState(initialRecipe?.prep_time?.toString() || '');
    const [difficulty, setDifficulty] = useState(initialRecipe?.difficulty || 'Media');
    const [calories, setCalories] = useState(initialRecipe?.calories?.toString() || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [video] = useState<File | null>(null);

    // Ingredient State
    const [ingredients, setIngredients] = useState<{ name: string, quantity: string }[]>(
        initialRecipe?.ingredients ? initialRecipe.ingredients.map((i: any) => ({
            name: i.name,
            quantity: i.unit && i.unit !== 'ud' ? `${i.quantity} ${i.unit}` : `${i.quantity}`
        })) : []
    );
    const [newIngName, setNewIngName] = useState('');
    const [newIngQty, setNewIngQty] = useState('');

    // Steps State
    const [steps, setSteps] = useState<{ text: string, image: File | null, imageUrl?: string }[]>(
        initialRecipe?.steps ? initialRecipe.steps.map((s: any) => ({
            text: s.text,
            image: null,
            imageUrl: s.image_url
        })) : [{ text: '', image: null }]
    );

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

    const handleAddStep = () => {
        setSteps([...steps, { text: '', image: null }]);
    };

    const handleRemoveStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const handleStepChange = (index: number, text: string) => {
        const newSteps = [...steps];
        newSteps[index].text = text;
        setSteps(newSteps);
    };

    const handleStepImageChange = (index: number, file: File | null) => {
        const newSteps = [...steps];
        newSteps[index].image = file;
        setSteps(newSteps);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!token) {
            setError('Autenticación perdida. Por favor inicia sesión de nuevo.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('prep_time', prepTime);
        formData.append('difficulty', difficulty);
        formData.append('calories', calories);

        // Map steps to JSON (text only) and append images separately
        const stepsData = steps.map((s, i) => {
            if (s.image) {
                formData.append(`step_image_${i}`, s.image);
            }
            return { text: s.text, image_url: s.imageUrl };
        });
        formData.append('steps', JSON.stringify(stepsData));

        // Mantener instructions para compatibilidad si el backend lo requiere
        formData.append('instructions', steps.map(s => s.text).join('\n'));

        // Send ingredients as JSON string
        formData.append('ingredients', JSON.stringify(ingredients));

        if (mainImage) formData.append('main_image', mainImage);
        if (video) formData.append('video', video);

        try {
            const url = initialRecipe ? `/api/recipes/${initialRecipe.id}` : '/api/recipes/';

            let finalResponse;
            if (initialRecipe) {
                finalResponse = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
            } else {
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
                setError(data.error || `Error ${finalResponse.status}`);
            }
        } catch (err: any) {
            setError(err.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-[#221810] border-4 border-black dark:border-[#5D4037] p-8 rounded-xl shadow-retro-lg w-full relative overflow-hidden">
                {/* VHS Scanline */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-size-[100%_4px]"></div>

                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-6 right-6 text-[#5D4037] dark:text-[#b9a89d] hover:text-primary transition-colors z-20"
                >
                    <span translate="no" className="material-symbols-outlined notranslate text-2xl font-bold">close</span>
                </button>

                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-primary mb-2 uppercase tracking-tighter">
                        {initialRecipe ? 'Editar Receta' : 'Grabar Nueva Receta'}
                    </h2>
                    <p className="font-mono text-[#5D4037] dark:text-[#b9a89d] text-sm tracking-widest uppercase">
                        {initialRecipe ? 'Modo Laboratorio' : 'Nueva Entrada'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 font-mono text-sm" role="alert">
                        <p className="font-bold">ERROR</p>
                        <p>{error}</p>
                    </div>
                )}


                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                                Nombre de la Receta
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                                placeholder="Classic Italian Carbonara..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                                Foto de Portada {initialRecipe && '(Opcional)'}
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setMainImage(e.target.files ? e.target.files[0] : null)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-2 font-mono file:mr-4 file:py-1 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:opacity-80 transition-all"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all min-h-[80px] resize-none"
                                placeholder="..."
                            />
                        </div>

                        <div>
                            <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                                Categoría
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all appearance-none cursor-pointer"
                            >
                                {['Desayuno', 'Comida', 'Cena', 'Snack', 'Postre'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                                Dificultad
                            </label>
                            <select
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all appearance-none cursor-pointer"
                            >
                                {['Fácil', 'Media', 'Difícil'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                                Tiempo Prep (min)
                            </label>
                            <input
                                type="number"
                                value={prepTime}
                                onChange={e => setPrepTime(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                            />
                        </div>

                        <div>
                            <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                                Calorías
                            </label>
                            <input
                                type="number"
                                value={calories}
                                onChange={e => setCalories(e.target.value)}
                                className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#3d2a24]">
                        <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                            Ingredientes
                        </label>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ingrediente (ej. Harina)"
                                value={newIngName}
                                onChange={e => setNewIngName(e.target.value)}
                                className="grow bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all text-sm"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                            />
                            <input
                                type="text"
                                placeholder="Cant. (ej. 200g)"
                                value={newIngQty}
                                onChange={e => setNewIngQty(e.target.value)}
                                className="w-1/4 bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all text-sm"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                            />
                            <button
                                type="button"
                                onClick={handleAddIngredient}
                                className="bg-black text-white border-2 border-black w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-[#2c241f] transition-all shadow-retro-sm active:translate-y-0.5"
                            >
                                +
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            {ingredients.map((ing, idx) => (
                                <div key={idx} className="px-3 py-1 bg-white text-black border-2 border-black rounded-full font-bold text-xs flex items-center gap-2 shadow-sm">
                                    <span>{ing.name}</span>
                                    <span className="opacity-40 font-mono text-[10px]">{ing.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveIngredient(idx)}
                                        className="hover:text-primary transition-colors ml-1 font-black"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-[#3d2a24]">
                        <div className="flex items-center justify-between">
                            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-primary">
                                Pasos de Preparación
                            </label>
                        </div>

                        <div className="space-y-6">
                            {steps.map((step, idx) => (
                                <div key={idx} className="relative bg-[#f8f7f6] dark:bg-[#2c241f] p-5 border-2 border-black dark:border-[#5D4037] rounded-lg shadow-retro-sm animate-fade-in-up">
                                    {/* Step Number */}
                                    <div className="absolute -left-3 -top-3 w-8 h-8 bg-black text-white font-bold flex items-center justify-center rounded-lg shadow-sm z-10">
                                        {idx + 1}
                                    </div>

                                    {/* Delete Step */}
                                    {steps.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStep(idx)}
                                            className="absolute -right-2 -top-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm z-10"
                                        >
                                            <span translate="no" className="material-symbols-outlined notranslate text-xs">close</span>
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                                        <div className="md:col-span-8">
                                            <textarea
                                                required
                                                value={step.text}
                                                onChange={e => handleStepChange(idx, e.target.value)}
                                                className="w-full bg-white dark:bg-background-dark text-black dark:text-cream border-2 border-black p-3 font-mono focus:outline-none focus:border-primary transition-all min-h-[100px] text-sm"
                                                placeholder={`Describe el paso ${idx + 1}...`}
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <div className="w-full md:w-1/3 relative group cursor-pointer border-2 border-dashed border-gray-400 dark:border-gray-600 rounded aspect-square flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 hover:border-primary transition-colors overflow-hidden">
                                                {(step.image || step.imageUrl) ? (
                                                    <img
                                                        src={step.image ? URL.createObjectURL(step.image) : step.imageUrl}
                                                        className="w-full h-full object-cover"
                                                        alt="preview"
                                                    />
                                                ) : (
                                                    <>
                                                        <span translate="no" className="material-symbols-outlined notranslate text-gray-400">add_a_photo</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Foto</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => handleStepImageChange(idx, e.target.files ? e.target.files[0] : null)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end w-full mt-2">
                            <button
                                type="button"
                                onClick={handleAddStep}
                                className="text-xs font-bold uppercase tracking-widest text-[#5D4037] hover:text-primary transition-colors flex items-center gap-1"
                            >
                                <span translate="no" className="material-symbols-outlined notranslate text-sm">add_circle</span>
                                Añadir Paso
                            </button>
                        </div>

                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-8">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-white hover:bg-gray-100 text-black font-bold uppercase py-3 border-2 border-black transition-all shadow-retro-sm active:translate-y-0.5 active:shadow-none tracking-widest"
                        >
                            CANCELAR
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary hover:bg-[#d95d00] text-white font-bold uppercase py-3 border-2 border-black transition-all shadow-retro-sm active:translate-y-0.5 active:shadow-none tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'GRABANDO...' : (initialRecipe ? 'ACTUALIZAR CINTA' : 'PUBLICAR CINTA')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRecipe;
