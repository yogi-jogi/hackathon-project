import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing      from "./pages/Landing";
import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Vault        from "./pages/Vault";
import CreateCapsule from "./pages/CreateCapsule";
import CapsuleView  from "./pages/CapsuleView";
import GhostWall    from "./pages/GhostWall";
import ShareView    from "./pages/ShareView";
import Insights     from "./pages/Insights";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <Routes>
            {/* Public */}
            <Route path="/"           element={<Landing />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/register"   element={<Register />} />
            <Route path="/ghost"      element={<GhostWall />} />
            <Route path="/share/:token" element={<ShareView />} />

            {/* Protected */}
            <Route path="/vault"   element={<ProtectedRoute><Vault /></ProtectedRoute>} />
            <Route path="/create"  element={<ProtectedRoute><CreateCapsule /></ProtectedRoute>} />
            <Route path="/capsule/:id" element={<ProtectedRoute><CapsuleView /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
