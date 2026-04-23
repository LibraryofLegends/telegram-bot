


    // ================= CALLBACK =================
 if (body.callback_query) {
  const data = body.callback_query.data;
  const chatId = body.callback_query.message.chat.id;

  await tg("answerCallbackQuery", {
    callback_query_id: body.callback_query.id
  });

  // ================= CONTINUE =================
  if (data === "continue") {
    const history = readHistory(chatId);

    if (!history.length) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "❌ Kein Verlauf vorhanden"
      });
    }

    const last = history[0];

    return tg("sendMessage", {
      chat_id: chatId,
      text: "▶️ Weiter schauen:",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "🎬 Öffnen",
            callback_data: `search_${last.id}_${last.type}`
          }
        ]]
      }
    });
  }

  // ================= MENU =================
  if (data === "netflix") {
    return showNetflixMenu(chatId);
  }

  // ================= PAGE =================
  if (data.startsWith("page_")) {
    const page = parseInt(data.split("_")[1], 10);

    return sendResultsList(
      chatId,
      global.LAST_HEADING,
      global.LAST_LIST,
      page
    );
  }

  // ================= TRENDING =================
  if (data === "net_trending") {
    const list = await getTrending();
    return sendResultsList(chatId, "🔥 Trending:", list, 0);
  }

  // ================= POPULAR =================
  if (data === "net_popular") {
    const list = await getPopular();
    return sendResultsList(chatId, "📈 Popular:", list, 0);
  }

  // ================= GENRE =================
  if (data.startsWith("genre_")) {
    const genre = data.split("_")[1];
    const list = await getByGenre(genre);
    return sendResultsList(chatId, "📂 Kategorie:", list, 0);
  }
  
  // ================= SERIES =================

// 📺 SERIE → STAFFELN
if (data.startsWith("tv_")) {

  const [, seriesKey] = data.split("_");

  const seasons = SERIES_DB[seriesKey];

  if (!seasons) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Staffel vorhanden"
    });
  }

  const buttons = Object.keys(seasons)
    .sort((a,b) => a - b)
    .map(season => ([
      {
        text: `📺 Staffel ${season}`,
        callback_data: `season_${seriesKey}_${season}`
      }
    ]));

  return tg("sendMessage", {
    chat_id: chatId,
    text: "📺 Staffel auswählen:",
    reply_markup: { inline_keyboard: buttons }
  });
}


// 🎬 STAFFEL → EPISODEN
if (data.startsWith("season_")) {

  const [, seriesKey, season] = data.split("_");

  const episodes = SERIES_DB?.[seriesKey]?.[season];

  if (!episodes) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Episoden vorhanden"
    });
  }

  const buttons = Object.keys(episodes)
    .sort((a,b) => a - b)
    .map(ep => ([
      {
        text: `🎬 Episode ${ep}`,
        callback_data: `episode_${seriesKey}_${season}_${ep}`
      }
    ]));

  return tg("sendMessage", {
    chat_id: chatId,
    text: `📺 Staffel ${season}`,
    reply_markup: { inline_keyboard: buttons }
  });
}


// ▶️ EPISODE → PLAYER UI
if (data.startsWith("episode_")) {

  const [, seriesKey, season, ep] = data.split("_");

  const item = SERIES_DB?.[seriesKey]?.[season]?.[ep];

  if (!item) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Episode nicht gefunden"
    });
  }

  return tg("sendMessage", {
    chat_id: chatId,
    text: `🎬 Episode ${ep} • Staffel ${season}`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "▶️ Stream",
            callback_data: `play_${seriesKey}_${season}_${ep}`
          },
          {
            text: "⬇️ Download",
            callback_data: `dl_${seriesKey}_${season}_${ep}`
          }
        ],
        [
          {
            text: "⬅️ Zurück",
            callback_data: `season_${seriesKey}_${season}`
          }
        ]
      ]
    }
  });
}


// ▶️ STREAM / DOWNLOAD
if (data.startsWith("play_") || data.startsWith("dl_")) {

  const [, seriesKey, season, ep] = data.split("_");

  const item = SERIES_DB?.[seriesKey]?.[season]?.[ep];

  if (!item) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Datei nicht gefunden"
    });
  }

  return tg("sendVideo", {
    chat_id: chatId,
    video: item.file_id,
    supports_streaming: true
  });
}

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