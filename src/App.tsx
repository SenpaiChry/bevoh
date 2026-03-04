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
import LeaderboardPage from "./components/Leaderboard";
import FriendsPage from "./components/Friends";
import HistoryPage from "./components/History";
import MenuMobile from "./components/MenuMobile";
import MenuDrinksPage from "./components/DrinkCatalogue";
import DrinkDetailPage from "./components/DrinkDetailPage";
import AuthPage from "./components/Auth";
import RequireAuth from "./RequireAuth";
import MyLogsPage from "./components/MyLogsPage";
import RequireAdmin from "./RequireAdmin";

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
            <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />
            <Route path="/add" element={<RequireAuth><AddDrinkPage /></RequireAuth>} />
            <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/mylogs" element={<RequireAuth><MyLogsPage /></RequireAuth>} />
            <Route path="/friends" element={<RequireAuth><FriendsPage /></RequireAuth>} />

            {/* AUTH - ADMIN */}
            {/* <Route path="/friends" element={<RequireAdmin><FriendsPage /></RequireAdmin>} /> */}

            {/* PUBLICS */}
            <Route path="/drinks" element={<MenuDrinksPage />} />
            <Route path="/drink/:id" element={<DrinkDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />

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
