// Stoke eta antilink pa gwoup (senp, an memwa — pou pwodiksyon, itilize yon fichye/baz done)
const antilinkGroups = new Set();
const linkRegex = /(chat\.whatsapp\.com|https?:\/\/)/i;

async function isSenderAdmin(sock, from, sender) {
  const metadata = await sock.groupMetadata(from);
  const participant = metadata.participants.find((p) => p.id === sender);
  return participant?.admin === "admin" || participant?.admin === "superadmin";
}

async function handle(sock, msg, command, args, from, sender) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

  // Tcheke si moun k ap voye kòmand la se admin (sof pou tagall/hidetag ki ka pi louvri)
  const adminOnly = ["kick", "add", "promote", "demote", "mute", "unmute", "antilink"];
  if (adminOnly.includes(command)) {
    const senderIsAdmin = await isSenderAdmin(sock, from, sender);
    if (!senderIsAdmin) {
      await sock.sendMessage(from, { text: "⚠️ Sèlman admin gwoup la ka itilize kòmand sa a." }, { quoted: msg });
      return;
    }
  }

  switch (command) {
    case "kick": {
      if (mentioned.length === 0) {
        await sock.sendMessage(from, { text: "⚠️ Mansyone moun ou vle retire a (@itilizatè)." }, { quoted: msg });
        return;
      }
      await sock.groupParticipantsUpdate(from, mentioned, "remove");
      await sock.sendMessage(from, { text: `✅ Retire ${mentioned.length} moun nan gwoup la.` }, { quoted: msg });
      break;
    }

    case "add": {
      const num = args[0]?.replace(/[^0-9]/g, "");
      if (!num) {
        await sock.sendMessage(from, { text: "⚠️ Itilize: .add <nimewo>" }, { quoted: msg });
        return;
      }
      const jid = num + "@s.whatsapp.net";
      await sock.groupParticipantsUpdate(from, [jid], "add");
      await sock.sendMessage(from, { text: `✅ ${num} ajoute nan gwoup la.` }, { quoted: msg });
      break;
    }

    case "promote": {
      if (mentioned.length === 0) {
        await sock.sendMessage(from, { text: "⚠️ Mansyone moun ou vle fè admin." }, { quoted: msg });
        return;
      }
      await sock.groupParticipantsUpdate(from, mentioned, "promote");
      await sock.sendMessage(from, { text: "✅ Pwomosyon fèt." }, { quoted: msg });
      break;
    }

    case "demote": {
      if (mentioned.length === 0) {
        await sock.sendMessage(from, { text: "⚠️ Mansyone moun ou vle retire wòl admin." }, { quoted: msg });
        return;
      }
      await sock.groupParticipantsUpdate(from, mentioned, "demote");
      await sock.sendMessage(from, { text: "✅ Wòl admin retire." }, { quoted: msg });
      break;
    }

    case "mute": {
      await sock.groupSettingUpdate(from, "announcement"); // sèlman admin ka ekri
      await sock.sendMessage(from, { text: "🔇 Gwoup la fèmen — sèlman admin ka ekri." }, { quoted: msg });
      break;
    }

    case "unmute": {
      await sock.groupSettingUpdate(from, "not_announcement"); // tout moun ka ekri
      await sock.sendMessage(from, { text: "🔊 Gwoup la louvri — tout moun ka ekri." }, { quoted: msg });
      break;
    }

    case "antilink": {
      const sub = args[0]?.toLowerCase();
      if (sub === "on") {
        antilinkGroups.add(from);
        await sock.sendMessage(from, { text: "✅ Antilink aktive nan gwoup sa a." }, { quoted: msg });
      } else if (sub === "off") {
        antilinkGroups.delete(from);
        await sock.sendMessage(from, { text: "✅ Antilink dezaktive." }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: "⚠️ Itilize: .antilink on  oswa  .antilink off" }, { quoted: msg });
      }
      break;
    }

    case "tagall": {
      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants.map((p) => p.id);
      const text = args.join(" ") || "📢 Tag tout moun:";
      const mentionText = participants.map((p) => `@${p.split("@")[0]}`).join(" ");
      await sock.sendMessage(from, { text: `${text}\n\n${mentionText}`, mentions: participants }, { quoted: msg });
      break;
    }

    case "hidetag": {
      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants.map((p) => p.id);
      const text = args.join(" ") || ".";
      // Mesaj la pa montre @mansyon yo vizibleman, men tout moun resevwa notifikasyon
      await sock.sendMessage(from, { text, mentions: participants }, { quoted: msg });
      break;
    }
  }
}

// Fonksyon pou tcheke lyen otomatikman (rele l nan sessionManager si ou vle aplike antilink sou TOUT mesaj)
function checkAntilink(from) {
  return antilinkGroups.has(from);
}

module.exports = { handle, checkAntilink, linkRegex };
