import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    currentView: string;
    onViewChange: (view: string) => void;
    onGoToProfile: (user: any, tab?: string) => void;
}

const Header: React.FC<HeaderProps> = ({
    currentView,
    onViewChange,
    onGoToProfile,
}) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        onViewChange('home');
    };

    return (
        <header className="sticky top-0 z-50 w-full flex flex-col border-b-4 border-black glass-retro transition-all duration-300 shadow-xl">
            {/* Top Row: Brand & Main Nav */}
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 text-primary cursor-pointer select-none group" onClick={() => onViewChange('home')}>
                        <span translate="no" className="material-symbols-outlined notranslate text-3xl transition-transform group-hover:scale-110 group-hover:rotate-12">local_dining</span>
                        <h2 className="hidden md:block text-white text-2xl font-bold tracking-tight uppercase transition-all duration-300 group-hover:text-primary" style={{ textShadow: "3px 3px 0 #000" }}>
                            ChefCommunity
                        </h2>
                    </div>
                    <nav className="hidden lg:flex items-center gap-8 ml-6">
                        <a onClick={() => onViewChange('home')} className={`text-xs font-black uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-all duration-200 relative group ${currentView === 'home' ? 'text-primary' : 'text-white/70'}`}>
                            Inicio
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${currentView === 'home' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </a>
                        {user && (
                            <>
                                <a onClick={() => onGoToProfile(user, 'recipes')} className={`text-xs font-black uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-all duration-200 relative group ${currentView === 'profile' ? 'text-primary' : 'text-white/70'}`}>
                                    Mi Perfil
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${currentView === 'profile' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </a>
                            </>
                        )}
                    </nav>
                </div>

                <div className="flex flex-1 justify-end gap-6 items-center">
                    {user ? (
                        <div className="flex items-center gap-5">
                            <button
                                onClick={() => onViewChange('create-recipe')}
                                className="hidden md:flex items-center justify-center rounded border-2 border-green-700 bg-white-900/30 text-green-400 hover:bg-green-700 hover:text-white h-9 px-4 text-xs font-bold uppercase transition-all duration-200 shadow-retro-sm active:translate-y-0.5"
                            >
                                + Receta
                            </button>
                            <div
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => onGoToProfile(user)}
                            >
                                <div className="relative">
                                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-9 h-9 rounded border-2 border-white/20 group-hover:border-primary transition-colors object-cover" alt="avatar" />
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-retro-green border-2 border-[#1a1614] rounded-full"></div>
                                </div>
                                <span className="font-bold text-white text-sm hidden sm:inline group-hover:text-primary transition-colors">{user.username}</span>
                            </div>
                            <button onClick={handleLogout} className="text-white/30 hover:text-red-500 transition-colors transform hover:scale-110 active:scale-95">
                                <span translate="no" className="material-symbols-outlined notranslate">logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={() => onViewChange('login')}
                                className="hidden sm:flex items-center justify-center rounded border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white h-11 px-6 text-sm font-bold uppercase transition-all active:translate-y-0.5"
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => onViewChange('register')}
                                className="flex items-center justify-center rounded border-2 border-black bg-primary hover:bg-[#d95d00] text-white h-11 px-6 text-sm font-bold uppercase shadow-retro transition-all active:translate-y-0.5 hover:shadow-retro-glow glow-primary"
                            >
                                Registrarse
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </header>
    );
};

export default Header;
