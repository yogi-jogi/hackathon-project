import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { notificationsApi } from "../api";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/vault", label: "Vault" },
  { to: "/create", label: "New Capsule" },
  { to: "/ghost", label: "Ghost Wall" },
  { to: "/insights", label: "Insights ✧" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try { setNotifications(await notificationsApi.list()); } catch (e) { }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = () => {
        fetchNotifications();
        showToast("You have a new notification", "info");
      };
      socket.on("new_notification", handleNewNotification);
      return () => socket.off("new_notification", handleNewNotification);
    }
  }, [socket, showToast]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id) => {
    try { await notificationsApi.markRead(id); fetchNotifications(); } catch (e) { }
  };

  const markAllRead = async () => {
    try { await notificationsApi.markAllRead(); fetchNotifications(); setShowDropdown(false); } catch (e) { }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 bg-bg/50 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <NavLink to="/vault" className="flex items-center gap-2 font-bold text-[0.9375rem] text-text no-underline mr-5 tracking-tight">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="w-[26px] h-[26px] rounded-md bg-accent-dim border border-accent/20 flex items-center justify-center text-xs text-accent"
          >
            ⏳
          </motion.span>
          CapsuleX
        </NavLink>

        {/* Nav links */}
        <nav className="flex gap-1 flex-1">
          {NAV.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? "text-text bg-white/10 shadow-sm" : "text-text-muted hover:text-text hover:bg-white/5"
              }`
            }>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* User area */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="relative p-2 rounded-md hover:bg-overlay text-text-muted hover:text-text transition-colors"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-bg shadow-[0_0_6px_rgba(129,140,248,0.8)]"></span>
              )}
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 glass-card overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-accent hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-text-muted">No notifications.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className={`px-4 py-3 border-b border-border/50 hover:bg-bg-2 transition-colors ${!n.read ? "bg-accent/5" : ""}`}>
                          <p className={`text-sm ${!n.read ? "font-medium text-text" : "text-text-2"}`}>{n.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[0.65rem] text-text-faint uppercase">{new Date(n.createdAt).toLocaleDateString()}</span>
                            {!n.read && (
                              <button onClick={() => markRead(n._id)} className="text-[0.65rem] font-medium text-accent hover:underline">Mark read</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl">
            <div className="w-[22px] h-[22px] rounded-full bg-accent-dim border border-accent/25 flex items-center justify-center text-[0.65rem] font-bold text-accent">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-[0.8125rem] text-text-2 font-medium">
              {user?.username}
            </span>
          </div>
          <button
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-all duration-300"
            onClick={() => { logout(); navigate("/"); }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header >
  );
}
