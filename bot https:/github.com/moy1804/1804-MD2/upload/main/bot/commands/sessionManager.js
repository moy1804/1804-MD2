const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const path = require("path");
const fs = require("fs");
const pino = require("pino");

const config = require("./config");
const { buildMenu } = require("./commands/menu");
const { handleCommand } = require("./commandHandler");

const sessions = {}; // sessionId -> { sock, jid }

async function startSession(sessionId, { onQR, onReady, onDisconnected }) {
  const sessionPath = path.join(__dirname, "..", "sessions", sessionId);
  fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
  });

  sessions[sessionId] = { sock, jid: null };

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      onQR(qr);
    }

    if (connection === "open") {
      sessions[sessionId].jid = sock.user?.id;
      console.log(`[${sessionId}] Konekte! ${sock.user?.id}`);

      // Mete foto pwofil 1804-MD
      try {
        const imgPath = config.profileImagePath;
        if (fs.existsSync(imgPath)) {
          await sock.updateProfilePicture(sock.user.id, { url: imgPath });
        }
      } catch (e) {
        console.log("Pa t ka mete foto pwofil:", e.message);
      }

      onReady({ jid: sock.user?.id });
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`[${sessionId}] Dekonekte, rezon:`, reason);

      if (reason !== DisconnectReason.loggedOut) {
        // Eseye rekonekte otomatikman (egzanp si entènèt koupe yon moman)
        startSession(sessionId, { onQR, onReady, onDisconnected });
      } else {
        onDisconnected(reason);
        delete sessions[sessionId];
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    try {
      await handleCommand(sock, msg);
    } catch (e) {
      console.error("Erè nan kòmand:", e);
    }
  });

  return sock;
}

function getSession(sessionId) {
  return sessions[sessionId];
}

function removeSession(sessionId) {
  const s = sessions[sessionId];
  if (s?.sock) {
    s.sock.end();
  }
  delete sessions[sessionId];
}

module.exports = { startSession, getSession, removeSession };
