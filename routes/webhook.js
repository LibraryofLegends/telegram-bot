const express = require("express");
const router = express.Router();

const { handleUpload } = require("../controllers/uploadController");

// ================= MAIN =================

router.post("/", async (req, res) => {

  try {

    const update = req.body;

    console.log("📩 Incoming Update");

    // 🔥 MESSAGE
    if (update.message) {

      const msg = update.message;

      // 👉 DEBUG
      console.log("📦 Message Type:", Object.keys(msg));

      // 🎬 VIDEO / FILE
      if (msg.video || msg.document) {
        console.log("🎥 Upload erkannt");

        await handleUpload(msg);
      }

    }

    // 🔥 CALLBACK (Buttons)
    if (update.callback_query) {

      console.log("🔘 Callback erkannt");

      // optional später
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err.message);
    res.sendStatus(500);
  }

});

module.exports = router;