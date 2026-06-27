const axios = require("axios");

// NÒT: API yo isit la se egzanp ak API gratis ki disponib piblikman.
// Si youn sispann fonksyone nan lavni, ranplase URL la nan fonksyon korespondan an.

async function handle(sock, msg, command, args, from) {
  const query = args.join(" ");

  if (!query) {
    await sock.sendMessage(
      from,
      { text: `⚠️ Itilize: .${command} <non oswa lyen>` },
      { quoted: msg }
    );
    return;
  }

  await sock.sendMessage(from, { text: "⏳ M ap chèche/telechaje, tann yon ti moman..." }, { quoted: msg });

  try {
    switch (command) {
      case "play": {
        // API gratis pou chèche/telechaje audio YouTube
        const res = await axios.get(`https://api.akuari.my.id/downloader/ytmp3?url=${encodeURIComponent(query)}`);
        const data = res.data?.result;
        if (!data?.download) throw new Error("Pa jwenn rezilta.");
        await sock.sendMessage(
          from,
          { audio: { url: data.download }, mimetype: "audio/mpeg", fileName: `${data.title || "audio"}.mp3` },
          { quoted: msg }
        );
        break;
      }

      case "video": {
        const res = await axios.get(`https://api.akuari.my.id/downloader/ytmp4?url=${encodeURIComponent(query)}`);
        const data = res.data?.result;
        if (!data?.download) throw new Error("Pa jwenn rezilta.");
        await sock.sendMessage(from, { video: { url: data.download }, caption: data.title || "" }, { quoted: msg });
        break;
      }

      case "tiktok": {
        const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(query)}`);
        const videoUrl = res.data?.video?.noWatermark || res.data?.video?.watermark;
        if (!videoUrl) throw new Error("Pa jwenn videyo a.");
        await sock.sendMessage(from, { video: { url: videoUrl }, caption: "✅ TikTok san watermak" }, { quoted: msg });
        break;
      }

      case "ig": {
        const res = await axios.get(`https://api.tiklydown.eu.org/api/download/instagram?url=${encodeURIComponent(query)}`);
        const media = res.data?.media || res.data?.url;
        if (!media) throw new Error("Pa jwenn medya a.");
        await sock.sendMessage(from, { video: { url: Array.isArray(media) ? media[0] : media } }, { quoted: msg });
        break;
      }
    }
  } catch (err) {
    console.error(`Erè download (${command}):`, err.message);
    await sock.sendMessage(
      from,
      { text: `❌ Erè pandan telechajman an: ${err.message}\n\n(Si erè a kontinye, API a ka pa disponib kounye a — n ap chanje l.)` },
      { quoted: msg }
    );
  }
}

module.exports = { handle };
