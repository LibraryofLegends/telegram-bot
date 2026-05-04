const fetch = global.fetch || require("node-fetch");

const TOKEN = process.env.TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME || "BOT";

// ================= CORE REQUEST =================

async function tg(method, payload) {
  try {

    const res = await fetch(
      `https://api.telegram.org/bot${TOKEN}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    if (!data.ok) {
      console.error("❌ TG ERROR:", data);
    }

    return data;

  } catch (err) {
    console.error("❌ TG FETCH ERROR:", err.message);
    return { ok: false };
  }
}

// ================= PLAYER URL =================

function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= INLINE SWIPE =================

function buildSwipeNav(id, type = "movie") {
  return {
    inline_keyboard: [

      [
        { text: "⬅️ Prev", callback_data: `prev_${id}_${type}` },
        { text: "▶️ Play", callback_data: `play_${id}` },
        { text: "➡️ Next", callback_data: `next_${id}_${type}` }
      ],

      [
        { text: "⭐ Fav", callback_data: `fav_${id}` },
        { text: "🔥 Similar", callback_data: `sim_${id}` }
      ],

      [
        { text: "🏠 Menu", callback_data: "menu" },
        { text: "🧠 For You", callback_data: "top_picks" }
      ]
    ]
  };
}

// ================= SEND VIDEO =================

async function sendFileById(chatId, item, options = {}) {

  if (!item?.file_id) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Datei nicht gefunden"
    });
  }

  return tg("sendVideo", {
    chat_id: chatId,
    video: item.file_id,
    supports_streaming: true,
    caption: options.caption || undefined,
    reply_markup: options.reply_markup || undefined
  });
}

// ================= SEND PHOTO =================

async function sendPhoto({ chatId, photo, caption, reply_markup, threadId }) {
  return tg("sendPhoto", {
    chat_id: chatId,
    message_thread_id: threadId,
    photo,
    caption,
    reply_markup
  });
}

// ================= SEND MESSAGE =================

async function sendMessage({ chatId, text, reply_markup, threadId }) {
  return tg("sendMessage", {
    chat_id: chatId,
    message_thread_id: threadId,
    text,
    reply_markup
  });
}

// ================= EDIT MESSAGE MEDIA =================

async function editMedia({ chatId, messageId, media, reply_markup }) {
  return tg("editMessageMedia", {
    chat_id: chatId,
    message_id: messageId,
    media,
    reply_markup
  });
}

// ================= CALLBACK ANSWER =================

async function answerCallback(callbackId) {
  return tg("answerCallbackQuery", {
    callback_query_id: callbackId
  });
}

// ================= SEND TO CHANNEL =================

function createSendToChannel({ getTargetChannel, getThreadByGenre }) {

  return async function sendToChannel({
    cover,
    caption,
    buttons,
    genreIds = []
  }) {

    try {

      const chatId = getTargetChannel(genreIds);
      const threadId = getThreadByGenre(genreIds);

      return await tg("sendPhoto", {
        chat_id: chatId,
        message_thread_id: threadId,
        photo: cover,
        caption,
        reply_markup: {
          inline_keyboard: buttons || []
        }
      });

    } catch (err) {
      console.error("❌ CHANNEL SEND ERROR:", err.message);
    }
  };
}

// ================= EXPORT =================

module.exports = {
  tg,
  playerUrl,
  buildSwipeNav,
  sendFileById,
  sendPhoto,
  sendMessage,
  editMedia,
  answerCallback,
  createSendToChannel
};