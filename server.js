// server.js

require("dotenv").config();

const express = require("express");
const webhook = require("./routes/webhook");

const app = express();

// ================= CONFIG =================

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;

// ================= MIDDLEWARE =================

// JSON Parser (Telegram sendet JSON)
app.use(express.json({
  limit: "10mb"
}));

// OPTIONAL: Logging Middleware
app.use((req, res, next) => {
  if (req.method === "POST") {
    console.log("📩 Incoming Update");
  }
  next();
});

// ================= ROUTES =================

// 🔥 Telegram Webhook
app.use("/bot", webhook);

// 🧪 Health Check
app.get("/", (req, res) => {
  res.send("🤖 Bot Server läuft");
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("❌ GLOBAL ERROR:", err.message);
  res.sendStatus(500);
});

// ================= START SERVER =================

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);

  if (!TOKEN) {
    console.log("⚠️ WARNUNG: TOKEN nicht gesetzt!");
  }
});