const express = require("express");
const router = express.Router();

const { handleUpload } = require("../controllers/uploadController");

// 🔒 DEINE TELEGRAM USER ID (WICHTIG!)
const ADMIN_ID = Number(process.env.ADMIN_ID);

// ================= MAIN =================

router.post("/", async (req, res) => {

  try {

    const update = req.body;

    console.log("📩 Incoming Update");

    // ================= MESSAGE =================

    if (update.message) {
  const msg = update.message;

  console.log("USER ID:", msg.from?.id); // 👈 HIER

  const userId = msg.from?.id;

      // 🔒 NUR ADMIN
      if (userId !== ADMIN_ID) {
        console.log("⛔ Ignored (not admin)");
        return res.sendStatus(200);
      }

      const file = msg.video || msg.document;

      if (!file) {
        console.log("⛔ Ignored (no file)");
        return res.sendStatus(200);
      }

      // 📁 DATEINAME CHECK
      const fileName = file.file_name || "";

      if (!fileName.toLowerCase().endsWith(".mp4")) {
        console.log("⛔ Ignored (not mp4)");
        return res.sendStatus(200);
      }

      console.log("🎥 MP4 erkannt vom Admin → Upload startet");

      await handleUpload(msg);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err.message);
    res.sendStatus(500);
  }

});

module.exports = router;