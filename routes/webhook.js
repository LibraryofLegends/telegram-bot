const router = require("express").Router();
const handleCallback = require("../controllers/callbackController");
const handleUpload = require("../controllers/uploadController");

router.post("/:token", async (req, res) => {
  res.sendStatus(200);

  const body = req.body;

  // 🔥 DEBUG LOG
  console.log("📩 Incoming Update:", JSON.stringify(body, null, 2));

  try {

    if (body.callback_query) {
      return await handleCallback(body.callback_query);
    }

    if (body.message) {
      return await handleUpload(body.message);
    }

  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
  }
});

module.exports = router;