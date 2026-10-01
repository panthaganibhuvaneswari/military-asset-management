import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const { user } = useAuth();
  const location = useLocation();

  // User is not logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // No specific role restriction
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check user's role
  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;