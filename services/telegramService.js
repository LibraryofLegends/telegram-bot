const fetch = global.fetch || require("node-fetch");

const TOKEN = process.env.TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME || "YOUR_BOT_USERNAME";

// ================= CORE =================

async function tg(method, body = {}) {

  try {

    const url = `https://api.telegram.org/bot${TOKEN}/${method}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!data.ok) {
      console.log("❌ TELEGRAM API ERROR:", method, data);
    }

    return data;

  } catch (err) {

    console.log("❌ TELEGRAM FETCH ERROR:", err.message);

    return { ok: false };
  }
}

// ================= BASIC =================

function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= MESSAGE =================

async function sendMessage({
  chatId,
  text,
  reply_markup = null,
  threadId = null
}) {

  return tg("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup,
    message_thread_id: threadId
  });
}

// ================= VIDEO =================

async function sendVideo({
  chatId,
  video,
  caption = null,
  reply_markup = null,
  threadId = null
}) {

  return tg("sendVideo", {
    chat_id: chatId,
    video,
    caption,
    reply_markup,
    message_thread_id: threadId,
    supports_streaming: true
  });
}

// ================= PHOTO =================

async function sendPhoto({
  chatId,
  photo,
  caption = null,
  reply_markup = null,
  threadId = null
}) {

  return tg("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    reply_markup,
    message_thread_id: threadId
  });
}

// ================= EDIT =================

async function editMessage({
  chatId,
  messageId,
  text,
  reply_markup = null
}) {

  return tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup
  });
}

async function editMedia({
  chatId,
  messageId,
  media,
  reply_markup = null
}) {

  return tg("editMessageMedia", {
    chat_id: chatId,
    message_id: messageId,
    media,
    reply_markup
  });
}

// ================= CALLBACK =================

async function answerCallback(callbackId, text = null) {

  return tg("answerCallbackQuery", {
    callback_query_id: callbackId,
    text
  });
}

// ================= FILE =================

async function sendFileById(chatId, item, options = {}) {

  if (!item || !item.file_id) {

    return sendMessage({
      chatId,
      text: "❌ Datei nicht gefunden"
    });
  }

  return sendVideo({
    chatId,
    video: item.file_id,
    caption: options.caption,
    reply_markup: options.reply_markup
  });
}

// ================= NAV UI =================

function buildSwipeNav(id, type = "movie") {

  return {
    inline_keyboard: [

      [
        { text: "⬅️", callback_data: `prev_${id}_${type}` },
        { text: "▶️ PLAY", callback_data: `play_${id}` },
        { text: "➡️", callback_data: `next_${id}_${type}` }
      ],

      [
        { text: "⭐ Favorit", callback_data: `fav_${id}` },
        { text: "🔥 Ähnliche", callback_data: `sim_${id}_${type}` }
      ],

      [
        { text: "🏠 Menü", callback_data: "menu" },
        { text: "🧠 Für dich", callback_data: "top_picks" }
      ]
    ]
  };
}

// ================= CHANNEL SENDER =================

function createSendToChannel({
  getTargetChannel,
  getThreadByGenre
}) {

  return async function sendToChannel({
    cover,
    caption,
    buttons,
    genreIds
  }) {

    try {

      const chatId = getTargetChannel(genreIds);
      const threadId = getThreadByGenre(genreIds);

      return await sendPhoto({
        chatId,
        threadId,
        photo: cover,
        caption,
        reply_markup: {
          inline_keyboard: buttons
        }
      });

    } catch (err) {

      console.log("❌ CHANNEL SEND ERROR:", err.message);
    }
  };
}

// ================= EXPORT =================

module.exports = {
  tg,
  playerUrl,
  sendMessage,
  sendVideo,
  sendPhoto,
  editMessage,
  editMedia,
  answerCallback,
  sendFileById,
  buildSwipeNav,
  createSendToChannel
};