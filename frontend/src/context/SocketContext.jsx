import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect if the user is logged in, or we just want global socket for ghost wall.
    // Actually, Ghost wall is public. So we always connect the socket.
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const newSocket = io(backendUrl, {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
