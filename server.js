const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("crypto");
const fs = require("fs");

const { startSession, getSession, removeSession } = require("./bot/sessionManager");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Yon moun konekte sou sit la:", socket.id);

  let sessionId = null;

  // Lè moun klike "Kreye Bot Mwen"
  socket.on("create-session", async () => {
    sessionId = "session_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    console.log("Nouvo sesyon:", sessionId);

    try {
      await startSession(sessionId, {
        onQR: async (qr) => {
          // Transfòme QR an imaj base64 epi voye l bay frontend
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
    // NOT: nou pa retire sesyon WhatsApp la la a — bot la dwe kontinye fonksyone
    // menm si moun nan kite paj wèb la, paske bot la endepandan kounye a.
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sèvè a ap kouri sou pò ${PORT}`);
});
