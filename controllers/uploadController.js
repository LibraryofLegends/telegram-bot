const {
  handleUpload: uploadWorker
} = require("../workers/uploadWorker");

// ================= CONTROLLER =================

async function handleUpload(msg) {
  try {
    // 🚀 Delegation an Worker (Clean Architecture)
    return await uploadWorker(msg);

  } catch (err) {
    console.error("❌ UPLOAD CONTROLLER ERROR:", err.message);

    // fallback response
    try {
      const tg = require("../services/telegramService").tg;

      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "❌ Upload fehlgeschlagen. Bitte erneut versuchen."
      });

    } catch (e) {
      console.error("❌ FATAL FALLBACK ERROR:", e.message);
    }
  }
}

// ================= EXPORT =================

module.exports = handleUpload;