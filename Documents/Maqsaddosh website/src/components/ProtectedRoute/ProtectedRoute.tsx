// Already provided in the previous response.
// Uses AuthContext to protect routes.
"use client"

import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

// Updated to use Outlet for nested routes as per modern React Router v6 patterns
function ProtectedRoute() {
  const { currentUser, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Yuklanmoqda...</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet /> // Child routes will render here
}

export default ProtectedRoute
