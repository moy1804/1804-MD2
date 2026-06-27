const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

async function downloadMedia(message, type) {
  const stream = await downloadContentFromMessage(message, type);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}

async function handle(sock, msg, command, from) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const imageMsg = msg.message?.imageMessage || quoted?.imageMessage;
  const videoMsg = msg.message?.videoMessage || quoted?.videoMessage;
  const stickerMsg = msg.message?.stickerMessage || quoted?.stickerMessage;

  try {
    switch (command) {
      case "sticker": {
        if (!imageMsg && !videoMsg) {
          await sock.sendMessage(
            from,
            { text: "⚠️ Voye yon foto/videyo ak kòmand .sticker, oswa reponn (reply) sou youn." },
            { quoted: msg }
          );
          return;
        }
        const media = imageMsg || videoMsg;
        const type = imageMsg ? "image" : "video";
        const buffer = await downloadMedia(media, type);
        await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
        break;
      }

      case "toimg": {
        if (!stickerMsg) {
          await sock.sendMessage(from, { text: "⚠️ Reponn (reply) sou yon stiker ak .toimg" }, { quoted: msg });
          return;
        }
        const buffer = await downloadMedia(stickerMsg, "sticker");
        await sock.sendMessage(from, { image: buffer }, { quoted: msg });
        break;
      }

      case "tovideo": {
        if (!stickerMsg) {
          await sock.sendMessage(from, { text: "⚠️ Reponn (reply) sou yon stiker anime ak .tovideo" }, { quoted: msg });
          return;
        }
        const buffer = await downloadMedia(stickerMsg, "sticker");
        await sock.sendMessage(from, { video: buffer, gifPlayback: true }, { quoted: msg });
        break;
      }
    }
  } catch (err) {
    console.error(`Erè stiker (${command}):`, err.message);
    await sock.sendMessage(from, { text: `❌ Erè: ${err.message}` }, { quoted: msg });
  }
}

module.exports = { handle };
