import { useState, useEffect } from 'react';
import RecipeDetail from './components/RecipeDetail';
import RecipeCard from './components/RecipeCard';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CreateRecipe from './components/CreateRecipe';
import './App.css';

function App() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<string>('home'); // home, detail, login, register, profile
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [viewedProfile, setViewedProfile] = useState<any>(null); // User to view in profile
  const [initialProfileTab, setInitialProfileTab] = useState<string>('recipes');

  // Cargar sesión
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const handleLogin = (data: any) => {
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setToken(data.token);
    setViewedProfile(data.user);
    setCurrentView('profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setViewedProfile(null);
    setCurrentView('login');
  };

  const goToProfile = (targetUser: any, tab: string = 'recipes') => {
    setViewedProfile(targetUser);
    setInitialProfileTab(tab);
    setCurrentView('profile');
  };

  // Cargar recetas del feed
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        // Si está logueado, usar sort=following, sino default
        const url = user ? '/api/recipes?sort=following' : '/api/recipes';
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(url, { headers });
        if (response.ok) {
          const data = await response.json();
          setRecipes(data);
        }
      } catch (err) {
        console.error("Error fetching recipes", err);
      }
    };
    fetchRecipes();
  }, [user, token]);

  const renderContent = () => {
    switch (currentView) {
      case 'detail':
        return <RecipeDetail
          recipe={selectedRecipe}
          token={token}
          user={user}
          onAuthorClick={(author) => goToProfile(author)}
          onEdit={() => setCurrentView('update-recipe')}
        />;
      case 'login':
        return <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'register':
        return <Register onLogin={handleLogin} onSwitchToLogin={() => setCurrentView('login')} />;
      case 'profile':
        return <Profile
          profileUser={viewedProfile || user}
          currentUser={user}
          token={token}
          initialTab={initialProfileTab}
          onRecipeClick={(recipe) => { setSelectedRecipe(recipe); setCurrentView('detail'); }}
        />;
      case 'create-recipe':
        return <CreateRecipe onCancel={() => setCurrentView('home')} onSuccess={() => { setViewedProfile(user); setCurrentView('profile'); }} token={token} />;
      case 'update-recipe':
        return <CreateRecipe
          initialRecipe={selectedRecipe}
          onCancel={() => setCurrentView('detail')}
          onSuccess={(updatedRecipe) => {
            if (updatedRecipe) {
              setSelectedRecipe(updatedRecipe);
            }
            setCurrentView('detail');
          }}
          token={token}
        />;
      case 'home':
      default:
        return (
          <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl text-primary font-bold">
                {user ? 'Tu Feed' : 'Cintas Frescas'}
              </h1>

              {/* Advanced Search Filter Teaser */}
              <div className="hidden md:flex gap-2">
                {['Más Gustados', 'Vegetariano', 'Rápido (30m)'].map(filter => (
                  <span key={filter} className="text-xs font-mono border border-[#5D4037] text-[#5D4037] dark:text-[#b9a89d] px-2 py-1 rounded-full cursor-pointer hover:bg-primary hover:text-white transition-colors">
                    {filter}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recipes.length > 0 ? recipes.map((recipe) => (
                <div key={recipe.id} onClick={() => { setSelectedRecipe(recipe); setCurrentView('detail'); }}>
                  <RecipeCard recipe={recipe} />
                </div>
              )) : (
                <div className="col-span-full py-20 text-center text-[#5D4037] dark:text-[#b9a89d] font-mono border-2 border-dashed border-[#5D4037]">
                  NO SE ENCONTRARON CINTAS. SÉ EL PRIMERO EN SUBIR UNA.
                </div>
              )}
            </div>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b-4 border-black bg-[#2c241f] px-6 py-4 shadow-retro">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-primary cursor-pointer select-none" onClick={() => setCurrentView('home')}>
            <span className="material-symbols-outlined text-3xl">local_dining</span>
            <h2 className="hidden md:block text-white text-2xl font-bold tracking-tight uppercase" style={{ textShadow: "2px 2px 0 #000" }}>
              ChefCommunity
            </h2>
          </div>
          <nav className="hidden lg:flex items-center gap-6 ml-4">
            <a onClick={() => setCurrentView('home')} className={`text-sm font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition-colors ${currentView === 'home' ? 'text-primary' : 'text-white/80'}`}>Feed</a>
            {user && (
              <>
                <a onClick={() => goToProfile(user, 'recipes')} className={`text-sm font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition-colors ${currentView === 'profile' && viewedProfile?.id === user.id ? 'text-primary' : 'text-white/80'}`}>Mi Laboratorio</a>
                <a onClick={() => goToProfile(user, 'collections')} className="text-white/80 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest cursor-pointer">Colecciones</a>
              </>
            )}
          </nav>
        </div>

        <div className="flex flex-1 justify-end gap-4 items-center">
          {/* User Controls */}
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline font-mono text-retro-green text-xs animate-pulse">● EN LÍNEA</span>
              <button
                onClick={() => setCurrentView('create-recipe')}
                className="hidden md:flex items-center justify-center rounded border-2 border-green-700 bg-green-900/50 text-green-400 hover:bg-green-900 hover:text-white h-8 px-3 text-xs font-bold uppercase transition-colors"
              >
                + Receta
              </button>
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                onClick={() => goToProfile(user)}
              >
                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-8 h-8 rounded border border-white" alt="avatar" />
                <span className="font-bold text-white text-sm hidden sm:inline">{user.username}</span>
              </div>
              <button onClick={handleLogout} className="text-white/50 hover:text-red-400">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView('login')}
                className="hidden sm:flex items-center justify-center rounded-lg border-2 border-black bg-[#1a1614] hover:bg-[#2c241f] text-white h-10 px-4 text-sm font-bold uppercase shadow-retro-sm transition-transform active:translate-y-0.5 active:shadow-none"
              >
                Entrar
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className="flex items-center justify-center rounded-lg border-2 border-black bg-primary hover:bg-[#d95d00] text-white h-10 px-4 text-sm font-bold uppercase shadow-retro-sm transition-transform active:translate-y-0.5 active:shadow-none"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {renderContent()}

      {/* Retro Footer */}
      {(currentView === 'home' || currentView === 'profile') && (
        <footer className="mt-auto bg-[#181411] border-t-4 border-[#392f28] py-12">
          <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3 text-white/50">
              <span className="material-symbols-outlined text-3xl">local_dining</span>
              <span className="font-display font-bold text-xl uppercase tracking-widest">ChefCommunity</span>
            </div>
            <div className="flex gap-8 text-sm font-mono text-[#b9a89d]">
              <a className="hover:text-primary hover:underline" href="#">TÉRMINOS</a>
              <a className="hover:text-primary hover:underline" href="#">PRIVACIDAD</a>
              <a className="hover:text-primary hover:underline" href="#">SOPORTE</a>
            </div>
            <div className="text-[#5D4037] text-xs font-mono">
              © 1984 ChefCommunity Systems.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
