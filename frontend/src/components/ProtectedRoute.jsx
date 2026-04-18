import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-center" style={{ minHeight: "100vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
