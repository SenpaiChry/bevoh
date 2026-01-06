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
            <Route path="/" element={<HomePage tonightDrinks={[]} totalDrinks={0} onRemoveDrink={function (id: number): void {
              throw new Error("Function not implemented.");
            } } onResetNight={function (): void {
              throw new Error("Function not implemented.");
            } } onQuickAdd={function (): void {
              throw new Error("Function not implemented.");
            } } />} />
            {/* <Route path="/" element={<Home />} /> */}
            <Route path="/home" element={<HomePage tonightDrinks={[]} totalDrinks={0} onRemoveDrink={function (id: number): void {
              throw new Error("Function not implemented.");
            }} onResetNight={function (): void {
              throw new Error("Function not implemented.");
            }} onQuickAdd={function (): void {
              throw new Error("Function not implemented.");
            }} />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/add" element={<AddDrinkPage onLogDrink={function (drink: { name: string; type: string; quantity: number; friends: string[]; time: string; location?: string; note?: string; photo?: string; }): void {
              throw new Error("Function not implemented.");
            }} onBack={function (): void {
              throw new Error("Function not implemented.");
            }} />} />
            {/* <Route path="/login" element={<Shop />} /> */}
            {/* <Route path="/drink/:id" element={<ProducDetail />} /> */}
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage totalDrinks={3} />} />
            {/* <Route path="/drinks" element={<Drinks />} /> */}
            <Route path="/friends" element={<FriendsPage />} />

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
