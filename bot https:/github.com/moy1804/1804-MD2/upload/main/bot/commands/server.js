const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const QRCode = require("qrcode");

const { startSession } = require("./bot/sessionManager");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Yon moun konekte sou sit la:", socket.id);

  socket.on("create-session", async () => {
    const sessionId = "session_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    console.log("Nouvo sesyon:", sessionId);

    try {
      await startSession(sessionId, {
        onQR: async (qr) => {
          const qrImage = await QRCode.toDataURL(qr);
          socket.emit("qr", qrImage);
        },
        onReady: (info) => {
          socket.emit("ready", info);
        },
        onDisconnected: (reason) => {
          socket.emit("disconnected", reason);
        },
      });
    } catch (err) {
      console.error("Erè pandan kreyasyon sesyon:", err);
      socket.emit("error", "Yon erè rive pandan koneksyon an. Eseye ankò.");
    }
  });

  socket.on("disconnect", () => {
    console.log("Moun sa dekonekte sou sit la:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sèvè a ap kouri sou pò ${PORT}`);
});
