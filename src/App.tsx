import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import ProfilePage from "./pages/ProfilePage";
import AddDrinkPage from "./components/AddDrink";
import HomePage from "./components/Home";
import MenuMobile from "./components/MenuMobile";
import MenuDrinksPage from "./components/DrinkCatalogue";
import DrinkDetailPage from "./components/DrinkDetailPage";
import AuthPage from "./components/Auth";
import RequireAuth from "./RequireAuth";
import MyLogsPage from "./components/MyLogsPage";
import RequireAdmin from "./RequireAdmin";
import FriendsPage from "./components/FriendsPage";
import GroupsPage from "./components/GroupsPage";
import DrinksAdminPage from "./components/DrinksAdminPage";
import IngredientsAdminPage from "./components/IngredientAdminPage";
import AdminLogoutPage from "./components/AdminLogoutPage";
import EditProfilePage from "./components/EditProfilePage";
import GamesPage from "./components/Games/GamesPage";
import NBAPredictor from "./components/TESTCLAUDE/NBAPredictor";
import NBAPredictorPython from "./components/TESTCLAUDE/NBAPredictorPython";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="md:mt-14">
          <Routes>
            {/* AUTH - USER */}
            <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
            {/* <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} /> */}
            <Route path="/add" element={<RequireAuth><AddDrinkPage /></RequireAuth>} />
            {/* <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} /> */}
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/editprofile" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
            <Route path="/mylogs" element={<RequireAuth><MyLogsPage /></RequireAuth>} />
            <Route path="/friends" element={<RequireAuth><FriendsPage /></RequireAuth>} />
            <Route path="/sessions" element={<RequireAuth><GroupsPage /></RequireAuth>} />

            {/* AUTH - ADMIN */}
            <Route path="/adminDrinks" element={<RequireAdmin><DrinksAdminPage /></RequireAdmin>} />
            <Route path="/adminIngredients" element={<RequireAdmin><IngredientsAdminPage /></RequireAdmin>} />
            <Route path="/adminLogout" element={<RequireAdmin><AdminLogoutPage /></RequireAdmin>} />

            {/* PUBLICS */}
            <Route path="/games" element={<GamesPage />} />
            <Route path="/drinks" element={<MenuDrinksPage />} />
            <Route path="/drink/:id" element={<DrinkDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* CLAUDE */}
            <Route path="/NBAPRED" element={<NBAPredictor />} />
            <Route path="/NBA" element={<NBAPredictorPython />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <div className="md:hidden">
          <MenuMobile />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
