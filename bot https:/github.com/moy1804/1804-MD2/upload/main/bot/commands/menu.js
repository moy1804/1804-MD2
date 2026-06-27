const config = require("../config");

function buildMenu(pushName = "") {
  const date = new Date().toLocaleDateString("fr-FR");
  const time = new Date().toLocaleTimeString("fr-FR");

  return `╭───❍ *${config.botName}* ❍───╮

👋 Bonjou${pushName ? " " + pushName : ""}, byenveni!
📅 Dat: ${date}   ⏰ Lè: ${time}

╭──「 *KÒMAND JENERAL* 」
│ ⚙️ .menu
│ 📶 .ping
│ 👑 .owner
╰────────────────

╭──「 *DOWNLOAD* 」
│ 🎵 .play <non chanson>
│ 🎬 .video <non/lyen>
│ 🎵 .tiktok <lyen>
│ 📸 .ig <lyen>
╰────────────────

╭──「 *STIKER* 」
│ 🖼️ .sticker
│ 🖌️ .toimg
│ 🎞️ .tovideo
╰────────────────

╭──「 *JESYON GWOUP* 」
│ 👤 .kick @itilizatè
│ ➕ .add <nimewo>
│ ⭐ .promote @itilizatè
│ ⬇️ .demote @itilizatè
│ 🔇 .mute
│ 🔊 .unmute
│ 🚫 .antilink on/off
│ 📢 .tagall
│ 🙈 .hidetag <mesaj>
╰────────────────

╭──「 *SEKIRITE* 」
│ ⛔ .block <nimewo>
│ ✅ .unblock <nimewo>
│ 🔧 .setprefix <senbòl>
╰────────────────

\`\`\`${config.footerTag}\`\`\``;
}

module.exports = { buildMenu };
