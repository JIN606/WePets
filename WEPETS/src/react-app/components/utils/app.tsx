




import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@hey-boss/users-service/react";
import { AuthProtect } from "./components/AuthProtect";

// Pages
import { HomePage } from "./pages/HomePage";
import { AuthCallback } from "./pages/AuthCallback";
import { LoginPage } from "./pages/LoginPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import { PetsPage } from "./pages/PetsPage";
import { MessagesPage } from "./pages/SquadPage";
import { QuestsPage } from "./pages/QuestsPage";
import { ProgressPage } from "./pages/ProgressPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";

// Components
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

              {/* Protected Game Routes */}
              <Route
                path="/messages"
                element={
                  <AuthProtect>
                    <MessagesPage />
                  </AuthProtect>
                }
              />
              <Route
                path="/pets"
                element={
                  <AuthProtect>
                    <PetsPage />
                  </AuthProtect>
                }
              />
              <Route
                path="/quests"
                element={
                  <AuthProtect>
                    <QuestsPage />
                  </AuthProtect>
                }
              />
              <Route
                path="/progress"
                element={
                  <AuthProtect>
                    <ProgressPage />
                  </AuthProtect>
                }
              />
              <Route
                path="/challenges"
                element={
                  <AuthProtect>
                    <ChallengesPage />
                  </AuthProtect>
                }
              />
              <Route
                path="/profile"
                element={
                  <AuthProtect>
                    <ProfilePage />
                  </AuthProtect>
                }
              />
              <Route
                path="/account"
                element={
                  <AuthProtect>
                    <ProfilePage />
                  </AuthProtect>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <AuthProtect>
                    <LeaderboardPage />
                  </AuthProtect>
                }
              />

              {/* Owner-Only Admin Route */}
              <Route
                path="/admin"
                element={
                  <AuthProtect>
                    <AdminDashboardPage />
                  </AuthProtect>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};





