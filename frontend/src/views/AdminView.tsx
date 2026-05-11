import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Recipe, User } from '../types';

interface AdminViewProps {
    onEditRecipe: (recipe: Recipe) => void;
    onUserClick: (user: User) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onEditRecipe, onUserClick }) => {
    const [activeTab, setActiveTab] = useState<'recipes' | 'users'>('recipes');
    const [users, setUsers] = useState<any[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const data = await api.admin.getUsers();
                setUsers(Array.isArray(data) ? data : []);
            } else {
                const data = await api.recipes.getAll({});
                setRecipes(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
            if (activeTab === 'users') setUsers([]);
            else setRecipes([]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleDeleteUser = async (id: number) => {
        if (window.confirm("¿Seguro que deseas eliminar este usuario y todo su contenido?")) {
            try {
                await api.admin.deleteUser(id);
                setUsers(users.filter(u => u.id !== id));
            } catch (e) {
                alert("Error al eliminar usuario.");
            }
        }
    };

    const handleDeleteRecipe = async (id: number) => {
         if (window.confirm("¿Seguro que deseas eliminar esta receta?")) {
            try {
                await api.recipes.delete(id);
                setRecipes(recipes.filter(r => r.id !== id));
            } catch (e) {
                alert("Error al eliminar receta.");
            }
        }
    };

    return (
        <div className="flex flex-col grow p-8 w-full max-w-7xl mx-auto overflow-y-auto">
            <h1 className="text-4xl font-bold uppercase tracking-widest text-[#181411] dark:text-white mb-8 border-b-4 border-black pb-4">
                Panel de Administración
            </h1>
            
            <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setActiveTab('recipes')} 
                  className={`px-6 py-3 font-bold uppercase tracking-wider text-sm border-2 border-black rounded shadow-retro-sm transition-all ${activeTab === 'recipes' ? 'bg-primary text-black' : 'bg-white text-black hover:bg-gray-100'}`}
                >
                    Gestión de Recetas
                </button>
                <button 
                  onClick={() => setActiveTab('users')} 
                  className={`px-6 py-3 font-bold uppercase tracking-wider text-sm border-2 border-black rounded shadow-retro-sm transition-all ${activeTab === 'users' ? 'bg-primary text-black' : 'bg-white text-black hover:bg-gray-100'}`}
                >
                    Gestión de Usuarios
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 font-mono animate-pulse">CARGANDO DATOS...</div>
            ) : activeTab === 'users' ? (
                <div className="overflow-x-auto border-2 border-black rounded-lg shadow-retro bg-white">
                    <table className="w-full text-left font-mono">
                        <thead className="bg-[#181411] text-white">
                            <tr>
                                <th className="p-4 uppercase">ID</th>
                                <th className="p-4 uppercase">Nombre</th>
                                <th className="p-4 uppercase">Rol</th>
                                <th className="p-4 uppercase">Recetas</th>
                                <th className="p-4 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50 text-black">
                                    <td className="p-4 font-bold">{u.id}</td>
                                    <td className="p-4 text-sm font-display font-bold">
                                        <button 
                                            onClick={() => onUserClick(u)}
                                            className="hover:text-primary transition-colors text-left"
                                        >
                                            @{u.username}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs uppercase rounded border ${u.rol === 'admin' ? 'bg-indigo-100 text-indigo-800 border-indigo-800' : 'bg-green-100 text-green-800 border-green-800'}`}>
                                            {u.rol || 'aprendiz'}
                                        </span>
                                    </td>
                                    <td className="p-4">{u.recipes_count || 0}</td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                         <select 
                                             value={u.rol} 
                                             onChange={async (e) => {
                                                 const newRol = e.target.value;
                                                 try {
                                                     await api.admin.updateUser(u.id, { rol: newRol });
                                                     setUsers(users.map(user => user.id === u.id ? { ...user, rol: newRol } : user));
                                                 } catch (err) {
                                                     console.error(err);
                                                     alert("Error al actualizar el rol del usuario.");
                                                 }
                                             }}
                                             className="bg-gray-100 border border-black text-[10px] p-1 font-bold rounded uppercase cursor-pointer"
                                         >
                                            <option value="aprendiz">Aprendiz</option>
                                            <option value="saludable">Saludable</option>
                                            <option value="chef">Chef</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {u.rol !== 'admin' && (
                                            <button 
                                              onClick={() => handleDeleteUser(u.id)}
                                              className="text-white bg-red-400 hover:bg-red-500 px-3 py-1 rounded text-xs uppercase font-bold border-2 border-red-900"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto border-2 border-black rounded-lg shadow-retro bg-white">
                    <table className="w-full text-left font-mono">
                        <thead className="bg-[#181411] text-white">
                            <tr>
                                <th className="p-4 uppercase">ID</th>
                                <th className="p-4 uppercase">Título</th>
                                <th className="p-4 uppercase">Autor</th>
                                <th className="p-4 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recipes.map(r => (
                                <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50 text-black">
                                    <td className="p-4 font-bold">{r.id}</td>
                                    <td className="p-4 text-sm font-display font-bold">{r.title}</td>
                                    <td className="p-4 text-xs">@{r.author}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => onEditRecipe(r)}
                                            className="text-black bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-xs uppercase font-bold border-2 border-black"
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteRecipe(r.id)}
                                            className="text-white bg-red-400 hover:bg-red-500 px-3 py-1 rounded text-xs uppercase font-bold border-2 border-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminView;
