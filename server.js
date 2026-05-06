require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");

// ================= INIT =================

const app = express();
app.use(express.json({ limit: "50mb" }));

// ================= CONFIG =================

const PORT = process.env.PORT || 10000;

// ================= LOGGING =================

function log(...args) {
  console.log("📩", ...args);
}

// ================= HEALTH =================

app.get("/", (req, res) => {
  return res.send("🚀 Telegram Bot Server läuft");
});

app.get("/health", (req, res) => {
  return res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// ================= WEBHOOK =================

let webhook;

try {
  webhook = require("./routes/webhook");
} catch (err) {
  console.error("❌ WEBHOOK LOAD ERROR:", err.message);
}

// nur laden wenn vorhanden
if (webhook) {
  app.use("/bot", webhook);
} else {
  console.error("❌ Webhook Route fehlt!");
}

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ================= START =================

app.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || "development"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

// ================= SAFE EXIT =================

process.on("uncaughtException", err => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
  console.error("❌ UNHANDLED REJECTION:", err);
});