// Already provided in the previous response.
// Sets up AuthProvider and routes.
"use client";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Registr from "./pages/registr/Registr";
import AddGoal from "./pages/addGoal/Goal";
import Edu from "./pages/edu/Edu";
import AllGoals from "./pages/allGoals/goals";
import GoalDetail from "./pages/goalDetail/goal-detail";
import Blog from "./pages/blog/blog";
import Profile from "./pages/profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import SearchResultsPage from "./pages/searchResults/SearchResultsPage";
import SupportPage from "./pages/help/Help";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken, token } = useAuth(); // Added token here to avoid re-triggering if already set

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl && tokenFromUrl !== token) {
      // Check if token is new
      setToken(tokenFromUrl);
      params.delete("token");
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true }
      );
    }
  }, [location, navigate, setToken, token]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<Registr />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/help" element={<SupportPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/search/goals" element={<SearchResultsPage />} />{" "}
        {/* New route for search results */}
        <Route path="/add-goal" element={<AddGoal />} />
        <Route path="/edu/:directionsId" element={<Edu />} />
        <Route path="/goals" element={<AllGoals />} />
        <Route path="/goals/:id" element={<GoalDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
