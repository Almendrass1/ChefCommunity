import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import RecipeCard from './RecipeCard';

interface ProfileProps {
    profileUser: any;
    currentUser: any;
    token: string | null;
    initialTab?: string;
    onRecipeClick?: (recipe: any) => void;
    onUserUpdate?: (user: any) => void;
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

const Profile: React.FC<ProfileProps> = ({ profileUser, currentUser, token, initialTab = 'recipes', onRecipeClick, onUserUpdate }) => {
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

    // State for Adding from Favorites
    const [isAddFromFavoritesOpen, setIsAddFromFavoritesOpen] = useState(false);
    const [selectedFavoritesToAdd, setSelectedFavoritesToAdd] = useState<number[]>([]);

    // Edit Profile State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        username: profileUser.username,
        bio: profileUser.bio || '',
        rol: profileUser.rol || 'aprendiz',
        password: '',
        avatar: null as File | null
    });
    const [updateLoading, setUpdateLoading] = useState(false);


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

    const handleDeleteCollection = async (collectionId: number) => {
        if (!token) return;

        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar Colección?',
            message: '¿Estás seguro de que quieres eliminar esta colección por completo? Esta acción no se puede deshacer.',
            type: 'danger',
            confirmText: 'Sí, Eliminar',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/users/me/collections/${collectionId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setProfileData((prev: any) => ({
                            ...prev,
                            collections: prev.collections.filter((c: any) => c.id !== collectionId)
                        }));
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }
                } catch (e) { console.error(e); }
            }
        });
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

    const handleSaveFavoritesToCollection = async () => {
        if (!token || !viewingCollection || selectedFavoritesToAdd.length === 0) return;

        try {
            for (const rid of selectedFavoritesToAdd) {
                await fetch(`/api/users/me/collections/${viewingCollection.id}/add/${rid}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            // Refresh viewing collection
            const res = await fetch(`/api/users/${profileUser.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setProfileData(data);
            const updatedCol = data.collections.find((c: any) => c.id === viewingCollection.id);
            if (updatedCol) setViewingCollection(updatedCol);

            setIsAddFromFavoritesOpen(false);
            setSelectedFavoritesToAdd([]);

            setConfirmModal({
                isOpen: true,
                title: '¡Añadido!',
                message: `${selectedFavoritesToAdd.length} recetas añadidas a la colección.`,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
                type: 'success',
                confirmText: 'Genial'
            });
        } catch (e) {
            console.error(e);
            alert("Error al añadir favoritos");
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setUpdateLoading(true);

        const formData = new FormData();
        formData.append('username', editFormData.username);
        formData.append('bio', editFormData.bio);
        formData.append('rol', editFormData.rol);
        if (editFormData.password) {
            formData.append('password', editFormData.password);
        }
        if (editFormData.avatar) {
            formData.append('avatar', editFormData.avatar);
        }

        try {
            const res = await fetch('/api/users/me', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfileData((prev: any) => ({ ...prev, user: data.user }));
                setIsEditModalOpen(false);
                if (onUserUpdate) onUserUpdate(data.user);

                setConfirmModal({
                    isOpen: true,
                    title: '¡Perfil Actualizado!',
                    message: 'Tus cambios se han guardado correctamente.',
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
                    type: 'success',
                    confirmText: 'Entendido'
                });
            } else {
                const errData = await res.json();
                alert(errData.error || "Error al actualizar perfil");
            }
        } catch (e) {
            console.error("Failed to update profile", e);
            alert("Error de conexión");
        } finally {
            setUpdateLoading(false);
        }
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
            <div className="bg-[#f8f7f6] dark:bg-[#221810] border-2 border-black dark:border-[#5D4037] p-4 md:p-8 rounded-xl mb-8 md:mb-12 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-8">
                    {/* TOP ROW on mobile: Avatar (Left) + Stats (Right) */}
                    <div className="flex flex-row items-center md:flex-col gap-4 md:gap-6 md:w-auto w-full">
                        {/* Avatar Column */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 md:w-40 md:h-40 rounded-full border-2 border-black dark:border-[#5D4037] overflow-hidden bg-primary shadow-retro">
                                <img
                                    src={profileUser.avatar_url || `https://ui-avatars.com/api/?name=${profileUser.username}&background=ec6d13&color=fff`}
                                    alt={profileUser.username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 ${roleInfo.color} border-2 px-1 py-0.5 md:px-2 md:py-1 text-[9px] md:text-xs font-bold font-mono uppercase rounded shadow-sm flex items-center gap-1`}>
                                <span translate="no" className="material-symbols-outlined notranslate text-[12px] md:text-[16px]">{roleInfo.icon}</span>
                                {roleInfo.label}
                            </div>
                        </div>

                        {/* Stats Column (Right side on mobile) */}
                        <div className="flex-1 flex gap-2 md:gap-6 justify-around md:justify-center md:hidden">
                            <div className="text-center">
                                <div className="text-xl md:text-2xl font-bold font-mono text-black dark:text-white">{layoutData.user.followers_count}</div>
                                <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#3d2a24] dark:text-[#b9a89d]">Seguidores</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl md:text-2xl font-bold font-mono text-black dark:text-white">{layoutData.user.following_count}</div>
                                <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#3d2a24] dark:text-[#b9a89d]">Siguiendo</div>
                            </div>
                        </div>
                    </div>

                    {/* Text Details & Buttons */}
                    <div className="text-left flex-1 mt-2 md:mt-0">
                        <h3 className="text-2xl md:text-4xl font-bold uppercase tracking-tight mb-1 md:mb-2 text-[#181411] dark:text-white flex items-center gap-2">
                            {profileData.user.username}
                            {isOwner && <span className="text-[10px] md:text-sm bg-black text-white px-2 py-0.5 md:py-1 rounded align-middle">TÚ</span>}
                        </h3>
                        <p className="font-mono text-xs md:text-base text-[#5D4037] dark:text-[#b9a89d] max-w-lg mb-2 md:mb-4">
                            {profileData.user.bio || "Aún no hay biografía. Solo buenas vibras."}
                        </p>
                        
                        {/* Role Presentation */}
                        <p className="font-serif italic text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-6 flex items-center justify-start gap-1 md:gap-2">
                            <span translate="no" className="material-symbols-outlined notranslate text-sm md:text-lg">format_quote</span>
                            {roleInfo.description}
                        </p>
                        
                        {/* Stats for Desktop only (hidden on mobile since they are at the top) */}
                        <div className="hidden md:flex gap-6 justify-start mb-6">
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
                        <button
                            onClick={() => {
                                setEditFormData({
                                    username: profileData.user.username,
                                    bio: profileData.user.bio || '',
                                    rol: profileData.user.rol || 'aprendiz',
                                    password: '',
                                    avatar: null
                                });
                                setIsEditModalOpen(true);
                            }}
                            className="w-full md:w-auto bg-primary hover:bg-[#d95d00] text-white font-bold py-2 px-4 text-xs md:text-base rounded border-2 border-black uppercase shadow-retro-sm active:translate-y-0.5 active:shadow-none transition-all z-10"
                        >
                            Editar Perfil
                        </button>

                    ) : (
                        <button
                            onClick={handleFollow}
                            className={`w-full md:w-auto font-bold py-2 px-4 text-xs md:text-base rounded border-2 border-black uppercase shadow-retro-sm active:translate-y-0.5 active:shadow-none transition-all z-10 flex items-center justify-center gap-2
                        ${layoutData?.is_following ? 'bg-black text-white hover:bg-gray-800' : 'bg-primary hover:bg-[#d95d00] text-white'}`}
                        >
                            {layoutData?.is_following ? (
                                <>
                                    <span translate="no" className="material-symbols-outlined notranslate text-sm">check</span>
                                    Siguiendo
                                </>
                            ) : (
                                <>
                                    <span translate="no" className="material-symbols-outlined notranslate text-sm">person_add</span>
                                    Seguir
                                </>
                            )}
                        </button>
                    )}
                </div>
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
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {profileData.recipes.length > 0 ? (
                            profileData.recipes.map((recipe: any) => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={{
                                        ...recipe,
                                        main_image_url: recipe.main_image_url || recipe.image_url
                                    }}
                                    showAuthor={false}
                                    onClick={() => onRecipeClick && onRecipeClick(recipe)}
                                />
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

                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                            {favorites.length > 0 ? (
                                favorites.map((recipe: any) => (
                                    <RecipeCard
                                        key={recipe.id}
                                        recipe={{
                                            ...recipe,
                                            main_image_url: recipe.main_image_url || recipe.image_url
                                        }}
                                        onClick={!isSelectionMode ? (() => onRecipeClick && onRecipeClick(recipe)) : (() => toggleRecipeSelection(recipe.id))}
                                    >
                                        {/* Selection Checkbox overlay */}
                                        {isSelectionMode && (
                                            <div className="absolute top-3 left-3 z-30 pointer-events-none">
                                                <div className={`w-7 h-7 rounded border-2 border-black flex items-center justify-center shadow-md ${selectedRecipes.includes(recipe.id) ? 'bg-primary' : 'bg-white/90 backdrop-blur-sm'}`}>
                                                    {selectedRecipes.includes(recipe.id) && <span translate="no" className="material-symbols-outlined text-white text-lg font-black">check</span>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Unlike Button overlay */}
                                        <div className="absolute top-3 right-3 z-30">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnlike(recipe.id); }}
                                                className="bg-white/90 backdrop-blur-sm text-pink-600 rounded-full p-2 border-2 border-black hover:bg-pink-50 hover:scale-110 transition-all shadow-lg group/unlike"
                                                title="Eliminar de favoritos"
                                            >
                                                <span translate="no" className="material-symbols-outlined notranslate text-xl block fill-current group-hover/unlike:scale-110">favorite</span>
                                            </button>
                                        </div>

                                        {/* Border highlighting for selection */}
                                        {isSelectionMode && selectedRecipes.includes(recipe.id) && (
                                            <div className="absolute inset-0 border-4 border-primary z-20 pointer-events-none rounded-2xl"></div>
                                        )}
                                    </RecipeCard>
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
                        <h3 className="font-bold text-2xl text-black mb-6 text-center underline decoration-wavy decoration-primary">Plan Semanal</h3>

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
                                                            <span translate="no" className="material-symbols-outlined notranslate text-lg">delete</span>
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
                                <span translate="no" className="material-symbols-outlined notranslate">shopping_cart</span>
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
                                    <span translate="no" className="material-symbols-outlined notranslate">arrow_back</span>
                                    Volver a Colecciones
                                </button>

                                <div className="bg-[#f8f7f6] dark:bg-[#2b2522] border-2 border-black dark:border-[#5D4037] p-6 rounded-xl shadow-retro mb-8 text-center relative overflow-hidden">
                                    {/* VHS Scanline */}
                                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-size-[100%_4px]"></div>

                                    <div className="relative z-10">
                                        <h2 className="text-3xl font-bold uppercase mb-2 text-[#0b0a08] dark:text-white">{viewingCollection.name}</h2>
                                        <p className="font-mono text-[#1d1411] dark:text-[#b9a89d] mb-4">{viewingCollection.description}</p>

                                        <div className="flex flex-wrap justify-center gap-4">
                                            <div className="bg-primary/20 text-primary px-3 py-1 rounded font-bold font-mono text-sm border border-primary/30 flex items-center">
                                                {viewingCollection.recipes?.length || 0} RECETAS
                                            </div>

                                            {isOwner && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setIsAddFromFavoritesOpen(true);
                                                            // Fetch favorites if not already loaded
                                                            if (favorites.length === 0) {
                                                                fetch('/api/users/me/likes', { headers: { 'Authorization': `Bearer ${token}` } })
                                                                    .then(res => res.json())
                                                                    .then(data => setFavorites(data));
                                                            }
                                                        }}
                                                        className="bg-white border-2 border-black px-4 py-1 text-xs font-bold uppercase hover:bg-gray-100 transition-all shadow-retro-sm flex items-center gap-2"
                                                    >
                                                        <span translate="no" className="material-symbols-outlined notranslate text-sm">favorite</span>
                                                        Añadir de Favoritos
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(`/api/users/me/collections/${viewingCollection.id}/shopping-list`, {
                                                                    method: 'POST',
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                if (res.ok) {
                                                                    const list = await res.json();
                                                                    setShoppingList(list);
                                                                    setIsShoppingListModalOpen(true);
                                                                }
                                                            } catch (e) { console.error(e); }
                                                        }}
                                                        className="bg-retro-green/20 text-retro-green border-2 border-retro-green px-4 py-1 text-xs font-bold uppercase hover:bg-retro-green hover:text-white transition-all shadow-retro-sm flex items-center gap-2"
                                                    >
                                                        <span translate="no" className="material-symbols-outlined notranslate text-sm">shopping_cart</span>
                                                        Generar Lista
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                    {viewingCollection.recipes && viewingCollection.recipes.length > 0 ? (
                                        viewingCollection.recipes.map((recipe: any) => (
                                            <RecipeCard
                                                key={recipe.id}
                                                recipe={{
                                                    ...recipe,
                                                    main_image_url: recipe.main_image_url || recipe.image_url
                                                }}
                                                onClick={() => onRecipeClick && onRecipeClick(recipe)}
                                            >
                                                {/* Remove from Collection Button for Owner */}
                                                {isOwner && (
                                                    <div className="absolute top-3 right-3 z-30">
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
                                                                                setViewingCollection((prev: any) => ({
                                                                                    ...prev,
                                                                                    recipes: prev.recipes.filter((r: any) => r.id !== recipe.id),
                                                                                    recipe_count: prev.recipe_count - 1
                                                                                }));
                                                                            }
                                                                        });
                                                                }
                                                            }}
                                                            className="bg-white/90 backdrop-blur-sm text-red-500 rounded-full p-2 border-2 border-black hover:bg-red-50 hover:scale-110 transition-all shadow-lg"
                                                            title="Quitar de colección"
                                                        >
                                                            <span translate="no" className="material-symbols-outlined notranslate text-xl block">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </RecipeCard>
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
                                        <div className="absolute top-2 left-2 text-retro-green font-mono text-xs border border-retro-green px-1 rounded">
                                            {col.recipe_count} VOLS
                                        </div>

                                        {isOwner && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCollection(col.id);
                                                }}
                                                className="absolute top-2 right-2 text-[#5D4037] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-20"
                                                title="Eliminar Colección"
                                            >
                                                <span translate="no" className="material-symbols-outlined notranslate text-sm">delete</span>
                                            </button>
                                        )}

                                        <h3 className="font-bold text-xl mb-2 mt-4">{col.name}</h3>
                                        <p className="text-[#b9a89d] text-sm font-mono line-clamp-2">{col.description}</p>
                                        <div className="mt-4 flex -space-x-2 overflow-hidden">
                                            {/* Visual stack effect */}
                                            <div className="w-8 h-8 rounded-full bg-gray-700 border border-black transform group-hover:translate-x-1 transition-transform"></div>
                                            <div className="w-8 h-8 rounded-full bg-gray-600 border border-black transform group-hover:translate-x-1 transition-transform delay-75"></div>
                                            <div className="w-8 h-8 rounded-full bg-gray-500 border border-black transform group-hover:translate-x-1 transition-transform delay-150 flex items-center justify-center text-xs font-bold">
                                                <span translate="no" className="material-symbols-outlined notranslate text-sm">arrow_forward</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isOwner && (
                                    <button
                                        onClick={() => setIsCollectionModalOpen(true)}
                                        className="border-4 border-dashed border-[#5D4037] p-6 rounded flex flex-col items-center justify-center text-[#5D4037] hover:bg-[#5D4037]/10 hover:text-primary transition-colors group h-full min-h-[160px]"
                                    >
                                        <span translate="no" className="material-symbols-outlined notranslate text-4xl mb-2 group-hover:scale-110 transition-transform">add_circle</span>
                                        <span className="font-bold uppercase tracking-wider">Nueva Colección</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add from Favorites Modal */}
            {isAddFromFavoritesOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e1a16] border-4 border-black dark:border-secondary p-8 rounded-xl shadow-retro-lg max-w-2xl w-full relative overflow-hidden">
                        {/* VHS Scanline */}
                        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-size-[100%_4px]"></div>

                        <button onClick={() => setIsAddFromFavoritesOpen(false)} className="absolute top-6 right-6 text-secondary hover:text-red-500 z-20">
                            <span translate="no" className="material-symbols-outlined notranslate text-2xl font-bold">close</span>
                        </button>

                        <div className="text-center mb-8 relative z-10">
                            <h3 className="text-3xl font-bold text-primary mb-1 uppercase tracking-tighter">Tus Favoritos</h3>
                            <p className="font-mono text-secondary dark:text-[#b9a89d] text-[10px] tracking-[0.2em] uppercase">Selecciona para añadir a la colección</p>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                            {favorites.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {favorites.map((recipe: any) => (
                                        <div
                                            key={recipe.id}
                                            onClick={() => {
                                                setSelectedFavoritesToAdd(prev =>
                                                    prev.includes(recipe.id) ? prev.filter(id => id !== recipe.id) : [...prev, recipe.id]
                                                );
                                            }}
                                            className={`flex items-center gap-4 p-3 border-2 transition-all cursor-pointer ${selectedFavoritesToAdd.includes(recipe.id)
                                                ? 'border-primary bg-primary/10 shadow-retro-sm'
                                                : 'border-black/10 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-black'
                                                }`}
                                        >
                                            <div className="w-16 h-16 rounded overflow-hidden border border-black/20 shrink-0">
                                                <img src={recipe.main_image_url || recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-bold text-sm truncate uppercase">{recipe.title}</h4>
                                                <p className="text-white text-[10px] font-mono opacity-60">{recipe.difficulty} • {recipe.prep_time} min</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedFavoritesToAdd.includes(recipe.id) ? 'bg-primary border-primary text-white' : 'border-black/20'}`}>
                                                {selectedFavoritesToAdd.includes(recipe.id) && <span translate="no" className="material-symbols-outlined text-sm">check</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 font-mono text-secondary italic border-2 border-dashed border-secondary/30 rounded-xl">
                                    No tienes recetas favoritas aún.
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex gap-4 relative z-10">
                            <button
                                onClick={() => setIsAddFromFavoritesOpen(false)}
                                className="btn-cancel flex-1 py-3 text-xs tracking-widest bg-amber-50 p-2"
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={handleSaveFavoritesToCollection}
                                disabled={selectedFavoritesToAdd.length === 0}
                                className="btn-primary flex-1 py-3 text-xs tracking-widest disabled:opacity-50  bg-amber-50 p-2"
                            >
                                AÑADIR {selectedFavoritesToAdd.length > 0 ? `(${selectedFavoritesToAdd.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Collection Modal */}
            {isCollectionModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#bbb4ac] dark:bg-[#1a1614] border-4 border-black dark:border-[#5D4037] p-6 rounded-lg shadow-retro-lg max-w-md w-full relative">
                        <button onClick={() => setIsCollectionModalOpen(false)} className="absolute top-2 right-2 text-[#5D4037] hover:text-red-500">
                            <span translate="no" className="material-symbols-outlined notranslate">close</span>
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
                                    <span translate="no" className="material-symbols-outlined notranslate">checklist</span>
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
                            <span translate="no" className="material-symbols-outlined notranslate">close</span>
                        </button>

                        <h2 className="text-3xl font-bold uppercase mb-2 text-center underline decoration-wavy decoration-primary">Lista de Compra</h2>
                        <p className="text-center font-mono text-xs mb-6 text-black/60 uppercase tracking-widest">Basada en tu plan semanal</p>

                        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {shoppingList.length > 0 ? (
                                <ul className="space-y-2">
                                    {shoppingList.map((item) => (
                                        <li key={item.name} className="flex justify-between items-center border-b border-dashed border-black/20 pb-2">
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
                                <span translate="no" className="material-symbols-outlined notranslate text-base">print</span>
                                Imprimir Lista
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#221810] border-4 border-black dark:border-secondary p-8 rounded-xl shadow-retro-lg max-w-lg w-full relative overflow-hidden">
                        {/* VHS Scanline */}
                        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-size-[100%_4px]"></div>

                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-6 right-6 text-secondary dark:text-[#b9a89d] hover:text-primary transition-colors z-20"
                        >
                            <span translate="no" className="material-symbols-outlined notranslate text-2xl font-bold">close</span>
                        </button>

                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-bold text-primary mb-1 uppercase tracking-tighter">Editar Perfil</h3>
                            <p className="font-mono text-secondary dark:text-[#b9a89d] text-[10px] tracking-[0.2em] uppercase">Mantenimiento de Cuenta</p>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-6 relative z-10">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-gray-200 shadow-retro-sm">
                                        <img
                                            src={editFormData.avatar ? URL.createObjectURL(editFormData.avatar) : profileData.user.avatar_url || `https://ui-avatars.com/api/?name=${profileData.user.username}`}
                                            className="w-full h-full object-cover"
                                            alt="Preview"
                                        />
                                    </div>
                                    <label className="cursor-pointer bg-white border-2 border-black px-3 py-1 text-[10px] font-bold uppercase hover:bg-gray-100 transition-all shadow-retro-sm active:translate-y-0.5">
                                        Cambiar Foto
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => setEditFormData({ ...editFormData, avatar: e.target.files?.[0] || null })}
                                        />
                                    </label>
                                </div>

                                <div className="flex-1 w-full space-y-4">
                                    <div>
                                        <label className="block font-mono text-[10px] font-bold uppercase tracking-wider mb-2 text-secondary dark:text-[#b9a89d]">
                                            Nombre de Usuario
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.username}
                                            onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-mono text-[10px] font-bold uppercase tracking-wider mb-2 text-secondary dark:text-[#b9a89d]">
                                            Especialidad (Rol)
                                        </label>
                                        <select
                                            value={editFormData.rol}
                                            onChange={(e) => setEditFormData({ ...editFormData, rol: e.target.value })}
                                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="aprendiz">Aprendiz</option>
                                            <option value="saludable">Saludable</option>
                                            <option value="chef">Chef</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider mb-2 text-secondary dark:text-[#b9a89d]">
                                    Biografía
                                </label>
                                <textarea
                                    value={editFormData.bio}
                                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                                    className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all h-24 resize-none text-sm"
                                    placeholder="Cuéntanos algo sobre ti..."
                                />
                            </div>

                            <div>
                                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider mb-2 text-primary">
                                    Nueva Contraseña (opcional)
                                </label>
                                <input
                                    type="password"
                                    value={editFormData.password}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="btn-cancel flex-1 py-3 text-xs tracking-widest bg-amber-50 p-2"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="btn-primary flex-1 py-3 text-xs tracking-widest bg-amber-50 p-2"
                                >
                                    {updateLoading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                                </button>
                            </div>
                        </form>
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
