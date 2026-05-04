// routes/webhook.js

const express = require("express");
const router = express.Router();

// ================= CONTROLLERS =================

const { handleUpload } = require("../controllers/uploadController");
const handleCallback = require("../controllers/callbackController");

// OPTIONAL (falls du Commands hast)
let handleCommand = null;
try {
  handleCommand = require("../controllers/commandController").handleCommand;
} catch {}

// ================= MAIN WEBHOOK =================

router.post("/:token", async (req, res) => {

  // ✅ Telegram sofort antworten (wichtig!)
  res.sendStatus(200);

  try {

    const body = req.body;

    if (!body) return;

    // ================= CALLBACK =================

    if (body.callback_query) {
      return handleCallback(body.callback_query);
    }

    // ================= MESSAGE =================

    if (body.message) {

      const msg = body.message;

      // 🎯 COMMANDS (/start etc.)
      if (msg.text && msg.text.startsWith("/")) {
        if (handleCommand) {
          return handleCommand(msg);
        }
      }

      // 🎬 MEDIA UPLOAD (Video / File)
      if (msg.video || msg.document) {
        return handleUpload(msg);
      }

      // 💬 TEXT FALLBACK (optional Logging)
      if (msg.text) {
        console.log("💬 TEXT MESSAGE:", msg.text);
      }
    }

    // ================= INLINE QUERY (OPTIONAL) =================

    if (body.inline_query) {
      console.log("🔍 INLINE QUERY:", body.inline_query.query);
      return;
    }

    // ================= UNKNOWN =================

    console.log("⚠️ UNKNOWN UPDATE:", JSON.stringify(body, null, 2));

  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err.message);
  }

});

// ================= HEALTH CHECK =================

router.get("/", (req, res) => {
  res.send("🤖 Bot läuft");
});

// ================= EXPORT =================

module.exports = router;