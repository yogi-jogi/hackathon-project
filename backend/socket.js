const { Server } = require("socket.io");

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          const allowed = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "https://hackathon-project-lemon-one.vercel.app"
          ];
          if (!origin || allowed.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);
      socket.on("disconnect", (reason) => {
        console.log(`🔌 [Socket.io] Client disconnected: ${socket.id} - Reason: ${reason}`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
