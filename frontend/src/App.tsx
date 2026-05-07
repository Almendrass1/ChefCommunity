import { useState, useEffect, useRef } from 'react';
import RecipeDetail from './components/RecipeDetail';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CreateRecipe from './components/CreateRecipe';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import HomeView from './views/HomeView';
import AdminView from './views/AdminView';
import { useAuth } from './context/AuthContext';
import { Recipe, User } from './types';
import { api } from './services/api';
import './App.css';

function App() {
  const [currentView, _setCurrentView] = useState<string>(() => {
    const path = window.location.pathname.substring(1).split('/')[0];
    return path || 'home';
  });

  const [initialProfileTab, setInitialProfileTab] = useState<string>(() => {
    const parts = window.location.pathname.split('/');
    if (parts[1] === 'profile' && parts[2]) {
        const tabMap: Record<string, string> = {
            'colecciones': 'collections',
            'recetas': 'recipes',
            'plan-semanal': 'meal plan',
            'favoritos': 'favorites'
        };
        return tabMap[parts[2]] || 'recipes';
    }
    return 'recipes';
  });

  const setCurrentView = (view: string, tab?: string) => {
    let path = `/${view === 'home' ? '' : view}`;
    if (view === 'profile' && tab) {
      const reverseTabMap: Record<string, string> = {
          'collections': 'colecciones',
          'recipes': 'recetas',
          'meal plan': 'plan-semanal',
          'favorites': 'favoritos'
      };
      path = `/profile/${reverseTabMap[tab] || 'recetas'}`;
    }
    window.history.pushState({ view, tab }, '', path + window.location.search);
    _setCurrentView(view);
    if (tab) setInitialProfileTab(tab);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1).split('/')[0];
      _setCurrentView(path || 'home');
      
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'profile' && parts[2]) {
          const tabMap: Record<string, string> = { 'colecciones': 'collections', 'recetas': 'recipes', 'plan-semanal': 'meal plan', 'favoritos': 'favorites' };
          setInitialProfileTab(tabMap[parts[2]] || 'recipes');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewedProfile, setViewedProfile] = useState<User | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentView]);

  // Discovery State (Now managed in App to share with Sidebar)
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const [searchQuery, setSearchQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('c') || '');
  const [difficulty, setDifficulty] = useState(params.get('d') || '');
  const [fridgeOnly, setFridgeOnly] = useState(params.get('fridge') === 'true');
  const [ingredientTags, setIngredientTags] = useState<string[]>(params.get('i') ? params.get('i')!.split(',') : []);
  const [ingInput, setIngInput] = useState('');
  const maxTimeParam = params.get('time');
  const [maxTime, setMaxTime] = useState<number | undefined>(maxTimeParam ? parseInt(maxTimeParam, 10) : undefined);
  const [isPopular, setIsPopular] = useState(params.get('pop') === 'true');

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('q', searchQuery);
    if (category) newParams.set('c', category);
    if (difficulty) newParams.set('d', difficulty);
    if (fridgeOnly) newParams.set('fridge', 'true');
    if (ingredientTags.length > 0) newParams.set('i', ingredientTags.join(','));
    if (isPopular) newParams.set('pop', 'true');
    if (maxTime) newParams.set('time', maxTime.toString());
    
    const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
    if (newSearch !== window.location.search) {
       window.history.replaceState(null, '', window.location.pathname + newSearch);
    }
  }, [searchQuery, category, difficulty, fridgeOnly, ingredientTags, isPopular, maxTime]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, token, login, updateUser } = useAuth();

  // Fetching logic moved here to centralize recipe data
  useEffect(() => {
    if (currentView !== 'home') return;

    const fetchRecipes = async () => {
      setLoading(true);
      try {
        let sort = user && !searchQuery && !category && !difficulty && !fridgeOnly ? 'following' : undefined;
        if (isPopular) sort = 'rating';

        const data = await api.recipes.getAll({
          sort,
          search: searchQuery || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          fridge: fridgeOnly,
          ingredients: fridgeOnly && ingredientTags.length > 0 ? ingredientTags.join(',') : undefined,
          max_time: maxTime
        });
        setRecipes(data);
      } catch (err) {
        console.error("Error fetching recipes", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchRecipes, 300);
    return () => clearTimeout(timer);
  }, [user, currentView, searchQuery, category, difficulty, fridgeOnly, ingredientTags, maxTime, isPopular]);

  const addIngredientTag = () => {
    if (ingInput.trim() && !ingredientTags.includes(ingInput.trim())) {
      setIngredientTags([...ingredientTags, ingInput.trim()]);
      setIngInput('');
    }
  };

  const removeIngredientTag = (tag: string) => {
    setIngredientTags(ingredientTags.filter(t => t !== tag));
  };

  const handleLogin = (data: { user: User; token: string }) => {
    login(data.user, data.token);
    setViewedProfile(data.user);
    setCurrentView('home');
  };

  const goToProfile = (targetUser: User, tab: string = 'recipes') => {
    setViewedProfile(targetUser);
    setInitialProfileTab(tab);
    setCurrentView('profile');
  };

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
          onUserUpdate={updateUser}
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
      case 'administracion':
        if (user && user.rol === 'admin') {
            return <AdminView 
                onEditRecipe={(recipe) => {
                    setSelectedRecipe(recipe);
                    setCurrentView('update-recipe');
                }}
            />;
        } else {
            // Un-authorized
            setTimeout(() => setCurrentView('home'), 0);
            return null;
        }
      case 'home':
      default:
        return loading ? (
          <div className="flex items-center justify-center grow font-mono text-primary animate-pulse">CARGANDO FEED...</div>
        ) : (
          <HomeView
            recipes={recipes}
            onRecipeClick={(recipe) => { setSelectedRecipe(recipe); setCurrentView('detail'); }}
            searchQuery={searchQuery}
            category={category}
            fridgeOnly={fridgeOnly}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col font-display overflow-hidden bg-background-light dark:bg-background-dark text-vhs-black dark:text-gray-100">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onGoToProfile={goToProfile}
      />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden pointer-events-auto">
        {currentView === 'home' && (
          <Sidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            category={category}
            setCategory={setCategory}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            fridgeOnly={fridgeOnly}
            setFridgeOnly={setFridgeOnly}
            ingredientTags={ingredientTags}
            setIngredientTags={setIngredientTags}
            ingInput={ingInput}
            setIngInput={setIngInput}
            addIngredientTag={addIngredientTag}
            removeIngredientTag={removeIngredientTag}
            isPopular={isPopular}
            setIsPopular={setIsPopular}
            maxTime={maxTime}
            setMaxTime={setMaxTime}
            user={user}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar flex flex-col scroll-smooth">
            <div className="flex-1">
              {renderContent()}
            </div>
            {(currentView === 'home' || currentView === 'profile') && <Footer />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
