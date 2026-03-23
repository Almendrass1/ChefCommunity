import { useState, useEffect } from 'react';
import RecipeDetail from './components/RecipeDetail';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CreateRecipe from './components/CreateRecipe';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import HomeView from './views/HomeView';
import { useAuth } from './context/AuthContext';
import { Recipe, User } from './types';
import { api } from './services/api';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewedProfile, setViewedProfile] = useState<User | null>(null);
  const [initialProfileTab, setInitialProfileTab] = useState<string>('recipes');

  // Discovery State (Now managed in App to share with Sidebar)
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [fridgeOnly, setFridgeOnly] = useState(false);
  const [ingredientTags, setIngredientTags] = useState<string[]>([]);
  const [ingInput, setIngInput] = useState('');
  const [maxTime, setMaxTime] = useState<number | undefined>(undefined);
  const [isPopular, setIsPopular] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, token, login, updateUser } = useAuth();

  // Fetching logic moved here to centralize recipe data
  useEffect(() => {
    if (currentView !== 'home') return;

    const fetchRecipes = async () => {
      setLoading(true);
      try {
        let sort = user && !searchQuery && !category && !difficulty && !fridgeOnly && ingredientTags.length === 0 ? 'following' : undefined;
        if (isPopular) sort = 'rating';

        const data = await api.recipes.getAll({
          sort,
          search: searchQuery || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          fridge: fridgeOnly,
          ingredients: ingredientTags.length > 0 ? ingredientTags.join(',') : undefined,
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
    setCurrentView('profile');
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
            ingredientTags={ingredientTags}
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
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
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
