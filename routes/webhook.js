const router = require("express").Router();

// ================= CONTROLLERS =================

const { handleUpload } = require("../controllers/uploadController");
const { handleCallback } = require("../controllers/callbackController");

// ================= WEBHOOK =================

router.post("/:token", async (req, res) => {

  // ⚡ Telegram braucht sofort Antwort
  res.sendStatus(200);

  try {

    const update = req.body;

    console.log("📩 Incoming Update");

    // ================= CALLBACK =================

    if (update.callback_query) {

      console.log("👉 Callback:", update.callback_query.data);

      return await handleCallback(update.callback_query);
    }

    // ================= MESSAGE =================

    if (update.message) {

      const msg = update.message;

      // 🔍 Debug
      console.log("👉 Message Type:", {
        text: !!msg.text,
        video: !!msg.video,
        document: !!msg.document
      });

      // ================= COMMANDS =================

      if (msg.text) {

        const text = msg.text.toLowerCase();

        // /start
        if (text.startsWith("/start")) {
          return handleStart(msg);
        }

        // /debug
        if (text === "/debug") {
          return handleDebug(msg);
        }
      }

      // ================= UPLOAD =================

      if (msg.video || msg.document) {

        console.log("🎬 Upload erkannt");

        return await handleUpload(msg);
      }
    }

  } catch (err) {

    console.error("❌ WEBHOOK ERROR:", err.message);

  }

});


// ================= COMMAND HANDLERS =================

const { tg } = require("../services/telegramService");

// 👉 /start
async function handleStart(msg) {

  return tg("sendMessage", {
    chat_id: msg.chat.id,
    text: `👋 Willkommen!

🎬 Sende einfach einen Film oder eine Episode
und ich kümmere mich um den Rest 🚀`
  });
}

// 👉 /debug
async function handleDebug(msg) {

  return tg("sendMessage", {
    chat_id: msg.chat.id,
    text: `🧪 DEBUG INFO

ID: ${msg.chat.id}
Video: ${!!msg.video}
Document: ${!!msg.document}`
  });
}

// ================= EXPORT =================

module.exports = router;