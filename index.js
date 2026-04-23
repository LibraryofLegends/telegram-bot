




  // ================= SEARCH =================
  if (data.startsWith("search_")) {
    const [, id, typeRaw] = data.split("_");
    const type = typeRaw === "tv" ? "tv" : "movie";

  if (type === "tv") {

  const details = await getDetails(id, type);

  const seriesKey = (details.name || "")
    .toLowerCase()
    .replace(/\s/g, "_");

  return tg("sendMessage", {
    chat_id: chatId,
    text: `📺 ${details.name}`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📺 Staffel öffnen",
            callback_data: `tv_${seriesKey}`
          }
        ]
      ]
    }
  });
}

  // ================= SIMILAR =================
  if (data.startsWith("sim_")) {
    const [, id, typeRaw] = data.split("_");
    const type = typeRaw === "tv" ? "tv" : "movie";

    const list = await getSimilar(id, type);
    return sendResultsList(chatId, "🎬 Ähnliche:", list, 0);
  }

  return; // 🔥 WICHTIG!
}

    // ================= START PARAM =================
    if (msg.text?.startsWith("/start ")) {
      const param = msg.text.split(" ")[1];
      if (param) return handleStart(msg, param);
    }

    // ================= SEARCH =================
    if (msg.text && !msg.text.startsWith("/")) {
      const result = await multiSearch(msg.text);

if (!result) {
  return tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "❌ Nichts gefunden"
  });
}

return tg("sendMessage", {
  chat_id: msg.chat.id,
  text: "🎬 Ergebnis gefunden – bitte auswählen",
  reply_markup: {
    inline_keyboard: [[
      {
        text: `🎬 ${sanitizeTelegramText(result.title || result.name)}`,
        callback_data: `search_${result.id}_${result.media_type || "movie"}`
      }
    ]]
  }
});

    }

    // ================= START MENU =================
    if (msg.text === "/start") {
      return showNetflixMenu(msg.chat.id);
    }

    // ================= UPLOAD =================
    if (msg.document || msg.video) {
      await handleUpload(msg);
    }
  } catch (err) {
    console.error("❌ Fehler:", err);
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ULTRA FINAL SYSTEM RUNNING");
});