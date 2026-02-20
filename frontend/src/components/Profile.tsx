import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';

interface ProfileProps {
    profileUser: any;
    currentUser: any;
    token: string | null;
    initialTab?: string;
    onRecipeClick?: (recipe: any) => void;
}

const rolePresentations: Record<string, { label: string, description: string, icon: string, color: string }> = {
    'saludable': {
        label: 'Saludable',
        description: 'Nutricionista apasionado. Enfocado en recetas balanceadas y vida sana.',
        icon: 'spa',
        color: 'bg-[#d1fae5] text-[#065f46] border-[#065f46]'
    },
    'aprendiz': {
        label: 'Aprendiz',
        description: 'Explorador culinario. Aprendiendo nuevos sabores y técnicas cada día.',
        icon: 'school',
        color: 'bg-[#fef3c7] text-[#92400e] border-[#92400e]'
    },
    'chef': {
        label: 'Chef',
        description: 'Maestro de la cocina. Creando experiencias gastronómicas únicas.',
        icon: 'restaurant_menu',
        color: 'bg-[#fee2e2] text-[#b91c1c] border-[#b91c1c]'
    },
    'admin': {
        label: 'Admin',
        description: 'Guardián de la comunidad. Gestionando el sabor y el orden.',
        icon: 'verified_user',
        color: 'bg-[#e0e7ff] text-[#3730a3] border-[#3730a3]'
    },
    'dueño': {
        label: 'Dueño',
        description: 'El Jefe. Donde todo comienza.',
        icon: 'local_police',
        color: 'bg-[#fae8ff] text-[#86198f] border-[#86198f]'
    }
};

const Profile: React.FC<ProfileProps> = ({ profileUser, currentUser, token, initialTab = 'recipes', onRecipeClick }) => {
    const isOwner = currentUser?.id === profileUser.id;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [profileData, setProfileData] = useState<any>(null);
    const [layoutData, setLayoutData] = useState<any>(null); // To store { is_following, etc }
    const [mealPlan, setMealPlan] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Collection & Selection State
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [collectionMode, setCollectionMode] = useState<'new' | 'existing'>('new');
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDesc, setNewCollectionDesc] = useState('');
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
    const [selectedRecipes, setSelectedRecipes] = useState<number[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Collection Detail View State
    const [viewingCollection, setViewingCollection] = useState<any>(null);

    // Shopping List State
    const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
    const [shoppingList, setShoppingList] = useState<any[]>([]);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'success' | 'info';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info'
    });

    const roleInfo = rolePresentations[profileUser.rol?.toLowerCase()] || rolePresentations[profileUser.rol] || rolePresentations['aprendiz'];

    // Map internal tab keys to Spanish display labels
    const tabLabels: Record<string, string> = {
        'recipes': 'Recetas',
        'collections': 'Colecciones',
        'meal plan': 'Plan Semanal',
        'favorites': 'Favoritos'
    };

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/users/${profileUser.id}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP error! status: ${response.status} - ${errorData.trace || ''}`);
                }
                const data = await response.json();
                setProfileData(data); // data.user, data.recipes, data.collections
                setLayoutData(data);  // data.is_following
            } catch (err: any) {
                console.error("Failed to load profile", err);
                setError(err.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        if (profileUser?.id) fetchProfile();
    }, [profileUser, token]);

    // Fetching tab-specific data
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;

            if (activeTab === 'meal plan' && isOwner) {
                try {
                    const res = await fetch('/api/users/me/meal-plan', { headers: { 'Authorization': `Bearer ${token}` } });
                    if (res.ok) setMealPlan(await res.json());
                } catch (e) { console.error("Failed to fetch meal plan", e); }
            } else if (activeTab === 'favorites' && isOwner) {
                try {
                    const res = await fetch('/api/users/me/likes', { headers: { 'Authorization': `Bearer ${token}` } });
                    if (res.ok) setFavorites(await res.json());
                } catch (e) { console.error("Failed to fetch favorites", e); }
            }
        };
        fetchData();
    }, [activeTab, token, isOwner]);

    const handleFollow = async () => {
        if (!token) {
            alert("Por favor inicia sesión para seguir usuarios.");
            return;
        }
        try {
            const res = await fetch(`/api/users/${profileUser.id}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLayoutData((prev: any) => ({
                    ...prev,
                    is_following: data.action === 'followed',
                    user: {
                        ...prev.user,
                        followers_count: prev.user.followers_count + (data.action === 'followed' ? 1 : -1)
                    }
                }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUnlike = async (recipeId: number) => {
        if (!token) return;
        try {
            const res = await fetch(`/api/recipes/${recipeId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Remove from favorites immediately
                setFavorites(prev => prev.filter(r => r.id !== recipeId));
            }
        } catch (e) {
            console.error("Failed to unlike", e);
        }
    };

    const toggleRecipeSelection = (id: number) => {
        setSelectedRecipes(prev =>
            prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
        );
    };

    const handleSaveCollection = async () => {
        if (!token) return;

        let targetCollectionId = selectedCollectionId;
        let collectionName = "";

        try {
            if (collectionMode === 'new') {
                if (!newCollectionName.trim()) return;
                // 1. Create Collection
                const res = await fetch('/api/users/me/collections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ name: newCollectionName, description: newCollectionDesc })
                });
                if (!res.ok) throw new Error("Failed to create collection");
                const newCol = await res.json();
                targetCollectionId = newCol.id;
                collectionName = newCol.name;
            } else {
                if (!targetCollectionId) return;
                collectionName = profileData.collections.find((c: any) => c.id.toString() === targetCollectionId)?.name || "Colección";
            }

            // 2. Add Selected Recipes
            if (selectedRecipes.length > 0) {
                for (const rid of selectedRecipes) {
                    await fetch(`/api/users/me/collections/${targetCollectionId}/add/${rid}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }
            }

            // 3. Refresh Profile Data
            const freshProfile = await fetch(`/api/users/${profileUser.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const freshData = await freshProfile.json();
            setProfileData(freshData);

            // Reset UI
            setIsCollectionModalOpen(false);
            setNewCollectionName('');
            setNewCollectionDesc('');
            setSelectedCollectionId('');
            setCollectionMode('new');
            setSelectedRecipes([]);
            setIsSelectionMode(false);
            setActiveTab('collections');

            // Replaced alert with Custom Success Modal
            setConfirmModal({
                isOpen: true,
                title: '¡Éxito!',
                message: `Recetas añadidas a "${collectionName}" correctamente.`,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
                type: 'success',
                confirmText: 'Genial'
            });
        } catch (e) {
            console.error(e);
            alert("Error al guardar la colección");
        }
    };

    const handleRemoveFromPlan = (planId: number) => {
        if (!token) return;

        // Replaced window.confirm with Custom Modal
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar Comida?',
            message: '¿Estás seguro de que quieres eliminar esta comida de tu plan?',
            type: 'danger',
            confirmText: 'Sí, Eliminar',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/users/me/meal-plan/${planId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setMealPlan(prev => prev.filter(p => p.id !== planId));
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }
                } catch (e) { console.error(e); }
            }
        });
    };

    const handleGenerateShoppingList = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/users/me/shopping-list/generate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const list = await res.json();
                setShoppingList(list);
                setIsShoppingListModalOpen(true);
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="text-center font-mono py-20">CARGANDO PERFIL...</div>;
    if (error || !profileData) return (
        <div className="text-center font-mono py-20 text-red-500 flex flex-col items-center">
            <span className="text-2xl font-bold">ERROR CARGANDO DATOS</span>
            <span className="text-sm mt-4 text-[#5D4037]">Error del servidor: {error}</span>
            <button onClick={() => window.location.reload()} className="mt-4 underline">Reintentar</button>
        </div>
    );

    const tabs = ['recipes', 'collections'];
    if (isOwner) {
        tabs.push('meal plan');
        tabs.push('favorites');
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Profile Header */}
            <div className="bg-[#f8f7f6] dark:bg-[#221810] border-4 border-black dark:border-[#5D4037] p-8 rounded-xl shadow-retro-lg mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

                <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-black dark:border-[#5D4037] overflow-hidden bg-primary shadow-retro">
                        <img
                            src={profileUser.avatar_url || `https://ui-avatars.com/api/?name=${profileUser.username}&background=ec6d13&color=fff`}
                            alt={profileUser.username}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className={`absolute -bottom-2 -right-2 ${roleInfo.color} border-2 px-2 py-1 text-xs font-bold font-mono uppercase rounded shadow-sm flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-[16px]">{roleInfo.icon}</span>
                        {roleInfo.label}
                    </div>
                </div>

                <div className="text-center md:text-left flex-1 z-10">
                    <h1 className="text-4xl font-bold uppercase tracking-tight mb-2 text-[#181411] dark:text-white">
                        {profileData.user.username}
                        {isOwner && <span className="ml-2 text-sm bg-black text-white px-2 py-1 rounded align-middle">TÚ</span>}
                    </h1>
                    <p className="font-mono text-[#5D4037] dark:text-[#b9a89d] max-w-lg mx-auto md:mx-0 mb-2">
                        {profileData.user.bio || "Aún no hay biografía. Solo buenas vibras."}
                    </p>
                    {/* Role Presentation */}
                    <p className="font-serif italic text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-center md:justify-start gap-2">
                        <span className="material-symbols-outlined text-lg">format_quote</span>
                        {roleInfo.description}
                    </p>

                    <div className="flex gap-6 justify-center md:justify-start">
                        <div className="text-center">
                            <div className="text-2xl font-bold font-mono text-black dark:text-white">{layoutData.user.followers_count}</div>
                            <div className="text-xs uppercase tracking-widest text-[#3d2a24] dark:text-[#b9a89d]">Seguidores</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold font-mono text-black dark:text-white">{layoutData.user.following_count}</div>
                            <div className="text-xs uppercase tracking-widest text-[#3d2a24] dark:text-[#b9a89d]">Siguiendo</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold font-mono text-black dark:text-white">{profileData.recipes.length}</div>
                            <div className="text-xs uppercase tracking-widest text-[#3d2a24] dark:text-[#b9a89d]">Recetas</div>
                        </div>
                    </div>

                    {isOwner ? (
                        <button className="bg-primary hover:bg-[#d95d00] text-white font-bold py-2 px-6 rounded border-2 border-black uppercase shadow-retro-sm active:translate-y-0.5 active:shadow-none transition-all z-10 mt-4">
                            Editar Perfil
                        </button>
                    ) : (
                        <button
                            onClick={handleFollow}
                            className={`font-bold py-2 px-6 rounded border-2 border-black uppercase shadow-retro-sm active:translate-y-0.5 active:shadow-none transition-all z-10 flex items-center gap-2 mt-4
                        ${layoutData?.is_following ? 'bg-black text-white hover:bg-gray-800' : 'bg-primary hover:bg-[#d95d00] text-white'}`}
                        >
                            {layoutData?.is_following ? (
                                <>
                                    <span className="material-symbols-outlined text-sm">check</span>
                                    Siguiendo
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">person_add</span>
                                    Seguir
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b-4 border-[#392f28] mb-8 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setViewingCollection(null); // Reset detail view when changing tabs
                        }}
                        className={`px-6 py-3 font-bold uppercase tracking-wider text-sm transition-colors whitespace-nowrap
              ${activeTab === tab
                                ? 'bg-primary text-white border-t-2 border-l-2 border-r-2 border-black -mb-1 relative z-10'
                                : 'text-[#5D4037] dark:text-[#b9a89d] hover:bg-[#392f28]/10'}`}
                    >
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'recipes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profileData.recipes.length > 0 ? (
                            profileData.recipes.map((recipe: any) => (
                                <div
                                    key={recipe.id}
                                    className="group relative bg-[#f8f7f6] dark:bg-[#221810] border-2 border-black dark:border-[#5D4037] rounded-lg p-4 shadow-retro hover:-translate-y-1 hover:shadow-retro-lg transition-all cursor-pointer"
                                    onClick={() => onRecipeClick && onRecipeClick(recipe)}
                                >
                                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                                    <h3 className="font-bold text-lg mb-2 text-black dark:text-white">{recipe.title}</h3>
                                    <div className="flex justify-between items-center text-sm font-mono text-[#5D4037] dark:text-[#b9a89d]">
                                        <span>{recipe.difficulty}</span>
                                        <span>{recipe.prep_time} min</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 font-mono text-[#5D4037] dark:text-[#b9a89d] border-2 border-dashed border-[#5D4037] rounded-xl">
                                AÚN NO HAY RECETAS REGISTRADAS
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'favorites' && (
                    <div className="flex flex-col gap-4">
                        {isOwner && (
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(!isSelectionMode);
                                        setSelectedRecipes([]);
                                    }}
                                    className={`px-4 py-2 text-sm font-bold uppercase rounded border-2 border-black transition-colors ${isSelectionMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                                >
                                    {isSelectionMode ? 'Cancelar Selección' : 'Seleccionar Recetas'}
                                </button>
                                {isSelectionMode && selectedRecipes.length > 0 && (
                                    <button
                                        onClick={() => setIsCollectionModalOpen(true)}
                                        className="px-4 py-2 text-sm font-bold uppercase rounded border-2 border-black bg-primary text-white hover:bg-[#d95d00]"
                                    >
                                        Crear Colección ({selectedRecipes.length})
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {favorites.length > 0 ? (
                                favorites.map((recipe: any) => (
                                    <div
                                        key={recipe.id}
                                        className={`group relative bg-[#f8f7f6] dark:bg-[#221810] border-2 rounded-lg p-4 shadow-retro transition-all
                                            ${isSelectionMode && selectedRecipes.includes(recipe.id) ? 'border-primary ring-2 ring-primary bg-orange-50 dark:bg-orange-900/20' : 'border-black dark:border-[#5D4037] hover:-translate-y-1 hover:shadow-retro-lg'}
                                            ${!isSelectionMode ? 'cursor-pointer' : ''}
                                        `}
                                        onClick={() => {
                                            if (isSelectionMode) toggleRecipeSelection(recipe.id);
                                            else if (onRecipeClick) onRecipeClick(recipe);
                                        }}
                                    >
                                        {isSelectionMode && (
                                            <div className="absolute top-2 left-2 z-20">
                                                <div className={`w-6 h-6 rounded border-2 border-black flex items-center justify-center ${selectedRecipes.includes(recipe.id) ? 'bg-primary' : 'bg-white'}`}>
                                                    {selectedRecipes.includes(recipe.id) && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 z-10">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnlike(recipe.id); }}
                                                className="bg-white text-pink-600 rounded-full p-2 border-2 border-black hover:bg-pink-50 hover:scale-110 transition-all shadow-sm"
                                                title="Eliminar de favoritos"
                                            >
                                                <span className="material-symbols-outlined text-xl block fill-current">favorite</span>
                                            </button>
                                        </div>

                                        <img
                                            src={recipe.main_image_url || recipe.image_url || "https://via.placeholder.com/400x300?text=No+Image"}
                                            alt={recipe.title}
                                            className="w-full h-48 object-cover rounded-lg mb-4 border-2 border-black/10"
                                        />

                                        <h3 className="font-bold text-lg mb-2 text-[#181411] dark:text-white">{recipe.title}</h3>

                                        <div className="flex justify-between items-center text-sm font-mono text-[#5D4037] dark:text-[#b9a89d]">
                                            <div className="flex items-center gap-2">
                                                <img src={recipe.author_avatar || `https://ui-avatars.com/api/?name=${recipe.author}&background=random`} className="w-6 h-6 rounded-full border border-black" />
                                                <span className="font-bold">{recipe.author}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 font-mono text-[#5D4037] dark:text-[#b9a89d] border-2 border-dashed border-[#5D4037] rounded-xl">
                                    AÚN NO HAY FAVORITOS. ¡DALE AMOR A ALGO!
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'meal plan' && (
                    <div className="bg-[#fef9c3] p-6 rounded shadow-retro rotate-1 border-2 border-black max-w-4xl mx-auto relative min-h-[400px]">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/40 rotate-[-1deg] backdrop-blur-sm border-l border-r border-white/20 shadow-sm z-10"></div>
                        <h3 className="font-bold text-2xl mb-6 text-center underline decoration-wavy decoration-primary">Plan Semanal</h3>

                        {mealPlan.length > 0 ? (
                            <div className="space-y-6">
                                {/* Group by Date Logic handled in render */}
                                {Object.entries(mealPlan.reduce((acc: any, plan: any) => {
                                    const date = new Date(plan.plan_date).toLocaleDateString('es-ES', { weekday: 'long', month: 'short', day: 'numeric' });
                                    if (!acc[date]) acc[date] = [];
                                    acc[date].push(plan);
                                    return acc;
                                }, {})).map(([date, plans]: [string, any]) => (
                                    <div key={date} className="bg-white/50 border-2 border-black/10 p-4 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3 text-[#5D4037] border-b border-black/10 pb-1 capitalize">{date}</h4>
                                        <div className="grid gap-3">
                                            {plans.map((plan: any) => (
                                                <div key={plan.id} className="flex items-center gap-4 bg-white p-3 rounded border border-black/20 shadow-sm group">
                                                    <span className="font-mono text-xs font-bold uppercase w-20 text-right">{plan.meal_time}</span>
                                                    <div className="w-1 h-8 bg-primary rounded-full"></div>
                                                    <div className="flex-grow">
                                                        <div className="font-bold text-[#181411] hover:text-primary cursor-pointer hover:underline" onClick={() => onRecipeClick && onRecipeClick(plan.recipe)}>{plan.recipe?.title || "Receta Desconocida"}</div>
                                                        <div className="text-xs text-[#5D4037]">{plan.recipe?.prep_time}m • {plan.recipe?.difficulty}</div>
                                                    </div>
                                                    {isOwner && (
                                                        <button
                                                            onClick={() => handleRemoveFromPlan(plan.id)}
                                                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                                            title="Eliminar del plan"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 font-mono text-[#5D4037]/60 italic border-2 border-dashed border-[#5D4037]/30 rounded-xl bg-white/30">
                                Tu horario está vacío. ¡Ve a una receta y haz clic en "Planificar"!
                            </div>
                        )}

                        <div className="text-center mt-8 pt-6 border-t-2 border-dashed border-[#5D4037]/30">
                            <button
                                onClick={handleGenerateShoppingList}
                                className="text-primary font-bold uppercase text-sm hover:underline flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                                disabled={mealPlan.length === 0}
                            >
                                <span className="material-symbols-outlined">shopping_cart</span>
                                Generar Lista de Compra
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'collections' && (
                    <>
                        {viewingCollection ? (
                            <div className="animate-fade-in">
                                <button
                                    onClick={() => setViewingCollection(null)}
                                    className="mb-6 flex items-center gap-2 text-[#5D4037] dark:text-[#b9a89d] hover:text-primary transition-colors font-bold uppercase text-sm"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Volver a Colecciones
                                </button>

                                <div className="bg-[#f8f7f6] dark:bg-[#2b2522] border-2 border-black dark:border-[#5D4037] p-6 rounded-xl shadow-retro mb-8 text-center">
                                    <h2 className="text-3xl font-bold uppercase mb-2 text-[#0b0a08] dark:text-white">{viewingCollection.name}</h2>
                                    <p className="font-mono text-[#1d1411] dark:text-[#b9a89d]">{viewingCollection.description}</p>
                                    <div className="mt-4 inline-block bg-primary/20 text-primary px-3 py-1 rounded font-bold font-mono text-sm border border-primary/30">
                                        {viewingCollection.recipes?.length || 0} RECETAS
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {viewingCollection.recipes && viewingCollection.recipes.length > 0 ? (
                                        viewingCollection.recipes.map((recipe: any) => (
                                            <div
                                                key={recipe.id}
                                                className="group relative bg-[#f8f7f6] dark:bg-[#221810] border-2 border-black dark:border-[#5D4037] rounded-lg p-4 shadow-retro hover:-translate-y-1 hover:shadow-retro-lg transition-all cursor-pointer"
                                                onClick={() => onRecipeClick && onRecipeClick(recipe)}
                                            >
                                                <img
                                                    src={recipe.main_image_url || recipe.image_url || "https://via.placeholder.com/400x300?text=No+Image"}
                                                    alt={recipe.title}
                                                    className="w-full h-48 object-cover rounded-lg mb-4"
                                                />
                                                {/* Remove from Collection Button for Owner */}
                                                {isOwner && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const confirmRemove = window.confirm("¿Quitar receta de esta colección?");
                                                            if (confirmRemove) {
                                                                fetch(`/api/users/me/collections/${viewingCollection.id}/recipes/${recipe.id}`, {
                                                                    method: 'DELETE',
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                })
                                                                    .then(res => {
                                                                        if (res.ok) {
                                                                            // Update local state to remove item
                                                                            setViewingCollection((prev: any) => ({
                                                                                ...prev,
                                                                                recipes: prev.recipes.filter((r: any) => r.id !== recipe.id),
                                                                                recipe_count: prev.recipe_count - 1
                                                                            }));
                                                                            // Also update main profile data if needed, but viewingCollection is separate state mostly
                                                                        }
                                                                    });
                                                            }
                                                        }}
                                                        className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-2 border-2 border-black hover:bg-red-50 hover:scale-110 transition-all shadow-sm z-10"
                                                        title="Quitar de colección"
                                                    >
                                                        <span className="material-symbols-outlined text-xl block">delete</span>
                                                    </button>
                                                )}
                                                <h3 className="font-bold text-lg mb-2 text-[#181411] dark:text-white">{recipe.title}</h3>
                                                <div className="flex justify-between items-center text-sm font-mono text-[#5D4037] dark:text-[#b9a89d]">
                                                    <span>{recipe.difficulty}</span>
                                                    <span>{recipe.prep_time} min</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-12 font-mono text-[#5D4037] dark:text-[#b9a89d] border-2 border-dashed border-[#5D4037] rounded-xl">
                                            Esta colección está vacía. ¡Añade algunas recetas!
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {profileData.collections.map((col: any) => (
                                    <div
                                        key={col.id}
                                        onClick={() => setViewingCollection(col)}
                                        className="bg-[#1a1614] border-2 border-[#5D4037] p-6 rounded shadow-retro-lg text-white relative group cursor-pointer hover:border-primary transition-colors hover:-translate-y-1"
                                    >
                                        <div className="absolute top-2 right-2 text-retro-green font-mono text-xs border border-retro-green px-1 rounded">
                                            {col.recipe_count} VOLS
                                        </div>
                                        <h3 className="font-bold text-xl mb-2">{col.name}</h3>
                                        <p className="text-[#b9a89d] text-sm font-mono line-clamp-2">{col.description}</p>
                                        <div className="mt-4 flex -space-x-2 overflow-hidden">
                                            {/* Visual stack effect */}
                                            <div className="w-8 h-8 rounded-full bg-gray-700 border border-black transform group-hover:translate-x-1 transition-transform"></div>
                                            <div className="w-8 h-8 rounded-full bg-gray-600 border border-black transform group-hover:translate-x-1 transition-transform delay-75"></div>
                                            <div className="w-8 h-8 rounded-full bg-gray-500 border border-black transform group-hover:translate-x-1 transition-transform delay-150 flex items-center justify-center text-xs font-bold">
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isOwner && (
                                    <button
                                        onClick={() => setIsCollectionModalOpen(true)}
                                        className="border-4 border-dashed border-[#5D4037] p-6 rounded flex flex-col items-center justify-center text-[#5D4037] hover:bg-[#5D4037]/10 hover:text-primary transition-colors group h-full min-h-[160px]"
                                    >
                                        <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">add_circle</span>
                                        <span className="font-bold uppercase tracking-wider">Nueva Colección</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Collection Modal */}
            {isCollectionModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#bbb4ac] dark:bg-[#1a1614] border-4 border-black dark:border-[#5D4037] p-6 rounded-lg shadow-retro-lg max-w-md w-full relative">
                        <button onClick={() => setIsCollectionModalOpen(false)} className="absolute top-2 right-2 text-[#5D4037] hover:text-red-500">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h2 className="text-2xl font-bold uppercase mb-6 text-center text-[#181411] dark:text-white">Guardar en Colección</h2>

                        {/* Mode Toggle */}
                        {profileData.collections.length > 0 && (
                            <div className="flex mb-6 border-2 border-black dark:border-[#5D4037] rounded overflow-hidden">
                                <button
                                    onClick={() => setCollectionMode('new')}
                                    className={`flex-1 py-2 font-bold uppercase text-sm ${collectionMode === 'new' ? 'bg-primary text-white' : 'bg-white dark:bg-black text-[#5D4037] dark:text-[#b9a89d] hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                >
                                    Nueva Colección
                                </button>
                                <button
                                    onClick={() => setCollectionMode('existing')}
                                    className={`flex-1 py-2 font-bold uppercase text-sm ${collectionMode === 'existing' ? 'bg-primary text-white' : 'bg-white dark:bg-black text-[#5D4037] dark:text-[#b9a89d] hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                >
                                    Existente
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            {collectionMode === 'new' ? (
                                <>
                                    <div>
                                        <label className="block font-mono text-xs font-bold uppercase mb-1 text-[#f6f3f2] dark:text-[#b9a89d]">Nombre</label>
                                        <input
                                            type="text"
                                            value={newCollectionName}
                                            onChange={(e) => setNewCollectionName(e.target.value)}
                                            placeholder="ej. Desayuno de Domingo"
                                            className="w-full text-white bg-white dark:bg-black border-2 border-black/20 dark:border-[#5D4037] p-2 rounded focus:outline-none focus:border-primary font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-mono text-xs font-bold uppercase mb-1 text-[#5D4037] dark:text-[#b9a89d]">Descripción (Opcional)</label>
                                        <textarea
                                            value={newCollectionDesc}
                                            onChange={(e) => setNewCollectionDesc(e.target.value)}
                                            placeholder="¿De qué trata esta colección?"
                                            className="w-full text-white bg-white dark:bg-black border-2 border-black/20 dark:border-[#5D4037] p-2 rounded focus:outline-none focus:border-primary h-24 resize-none"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block font-mono text-xs font-bold uppercase mb-1 text-[#5D4037] dark:text-[#b9a89d]">Seleccionar Colección</label>
                                    <select
                                        value={selectedCollectionId}
                                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                                        className="w-full bg-white dark:bg-black border-2 border-black/20 dark:border-[#5D4037] p-2 rounded focus:outline-none focus:border-primary font-bold"
                                    >
                                        <option value="">-- Elige una Colección --</option>
                                        {profileData.collections.map((col: any) => (
                                            <option key={col.id} value={col.id}>{col.name} ({col.recipe_count})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Show selected recipes hint if coming from Favorites */}
                            {selectedRecipes.length > 0 && (
                                <div className="bg-primary/10 border-l-4 border-primary p-3 text-sm font-mono text-primary flex items-center gap-2">
                                    <span className="material-symbols-outlined">checklist</span>
                                    <span>{selectedRecipes.length} recetas seleccionadas para añadir.</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t-2 border-black/10 dark:border-[#5D4037]/30">
                                <button
                                    onClick={() => setIsCollectionModalOpen(false)}
                                    className="px-4 py-2 font-bold uppercase text-[#5D4037] hover:bg-black/5 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCollection}
                                    disabled={collectionMode === 'new' ? !newCollectionName.trim() : !selectedCollectionId}
                                    className="bg-primary hover:bg-[#d95d00] text-white font-bold py-2 px-6 rounded border-2 border-black uppercase shadow-retro-sm active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shopping List Modal */}
            {isShoppingListModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#fffbeb] border-4 border-black p-8 rounded shadow-retro-lg max-w-lg w-full relative rotate-1">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-8 bg-[#e5e7eb] rotate-[-1deg] border border-black/20 shadow-sm z-10"></div>
                        <button onClick={() => setIsShoppingListModalOpen(false)} className="absolute top-2 right-2 text-black/50 hover:text-red-500">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h2 className="text-3xl font-bold uppercase mb-2 text-center underline decoration-wavy decoration-primary">Lista de Compra</h2>
                        <p className="text-center font-mono text-xs mb-6 text-black/60 uppercase tracking-widest">Basada en tu plan semanal</p>

                        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {shoppingList.length > 0 ? (
                                <ul className="space-y-2">
                                    {shoppingList.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center border-b border-dashed border-black/20 pb-2">
                                            <span className="font-bold font-mono text-lg">{item.name}</span>
                                            <span className="bg-primary/20 text-primary px-2 py-1 rounded font-bold text-sm">{item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 font-mono italic text-black/50">
                                    ¡Todo listo! Tienes todo lo que necesitas.
                                </div>
                            )}
                        </div>

                        <div className="mt-8 text-center print:hidden">
                            <button
                                onClick={() => window.print()}
                                className="text-black font-bold uppercase text-xs border-2 border-black px-4 py-2 rounded hover:bg-black hover:text-white transition-colors gap-2 inline-flex items-center"
                            >
                                <span className="material-symbols-outlined text-base">print</span>
                                Imprimir Lista
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
};

export default Profile;
