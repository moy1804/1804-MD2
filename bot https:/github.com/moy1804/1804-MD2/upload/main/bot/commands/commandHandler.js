const config = require("./config");
const { buildMenu } = require("./commands/menu");

function getText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ""
  );
}

function isGroup(jid) {
  return jid.endsWith("@g.us");
}

async function handleCommand(sock, msg) {
  const from = msg.key.remoteJid;
  const text = getText(msg).trim();
  const prefix = config.defaultPrefix;

  // Tcheke antilink sou TOUT mesaj nan gwoup (pa sèlman kòmand)
  if (isGroup(from)) {
    const groupCommands = require("./commands/group");
    if (groupCommands.checkAntilink(from) && groupCommands.linkRegex.test(text)) {
      const sender = msg.key.participant || msg.key.remoteJid;
      try {
        await sock.sendMessage(from, { delete: msg.key }); // efase mesaj la
        await sock.groupParticipantsUpdate(from, [sender], "remove"); // mete moun nan deyò
        await sock.sendMessage(from, { text: "🚫 Lyen detekte — mesaj efase, moun nan retire." });
      } catch (e) {
        console.log("Erè antilink:", e.message);
      }
      return;
    }
  }

  if (!text.startsWith(prefix)) return;

  const args = text.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  const pushName = msg.pushName || "";
  const sender = msg.key.participant || msg.key.remoteJid;

  switch (command) {
    // ---------- JENERAL ----------
    case "menu": {
      await sock.sendMessage(from, { text: buildMenu(pushName) }, { quoted: msg });
      break;
    }

    case "ping": {
      const start = Date.now();
      const sent = await sock.sendMessage(from, { text: "🏓 Kalkile..." }, { quoted: msg });
      const ms = Date.now() - start;
      await sock.sendMessage(from, { text: `🏓 Pong! ${ms}ms\n\n${config.footerTag}` }, { quoted: msg });
      break;
    }

    case "owner": {
      await sock.sendMessage(
        from,
        { text: `👑 *${config.botName}*\n\nSe bot pèsonèl. Kontak pwopriyetè a dirèkteman.\n\n${config.footerTag}` },
        { quoted: msg }
      );
      break;
    }

    // ---------- GWOUP (sekirite minimòm) ----------
    case "kick":
    case "add":
    case "promote":
    case "demote":
    case "mute":
    case "unmute":
    case "antilink":
    case "tagall":
    case "hidetag": {
      if (!isGroup(from)) {
        await sock.sendMessage(from, { text: "⚠️ Kòmand sa a fonksyone sèlman nan gwoup." }, { quoted: msg });
        return;
      }
      const groupCommands = require("./commands/group");
      await groupCommands.handle(sock, msg, command, args, from, sender);
      break;
    }

    // ---------- DOWNLOAD ----------
    case "play":
    case "video":
    case "tiktok":
    case "ig": {
      const downloadCommands = require("./commands/download");
      await downloadCommands.handle(sock, msg, command, args, from);
      break;
    }

    // ---------- STIKER ----------
    case "sticker":
    case "toimg":
    case "tovideo": {
      const stickerCommands = require("./commands/sticker");
      await stickerCommands.handle(sock, msg, command, from);
      break;
    }

    // ---------- SEKIRITE / OWNER ----------
    case "block":
    case "unblock": {
      const num = args[0]?.replace(/[^0-9]/g, "");
      if (!num) {
        await sock.sendMessage(from, { text: "⚠️ Itilize: .block <nimewo>" }, { quoted: msg });
        return;
      }
      const targetJid = num + "@s.whatsapp.net";
      await sock.updateBlockStatus(targetJid, command === "block" ? "block" : "unblock");
      await sock.sendMessage(from, { text: `✅ ${command === "block" ? "Bloke" : "Debloke"}: ${num}` }, { quoted: msg });
      break;
    }

    case "setprefix": {
      await sock.sendMessage(
        from,
        { text: "⚠️ Fonksyonalite sa a poko aktive konplètman (chanjman prefiks pa moun, pa global). Vini pita." },
        { quoted: msg }
      );
      break;
    }

    default:
      // Pa konn kòmand lan, pa reponn (evite spam si moun ekri tèks pa aksidan)
      break;
  }
}

module.exports = { handleCommand };
