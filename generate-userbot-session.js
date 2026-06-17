require("dotenv").config();

const input = require("input");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  console.error("❌ TELEGRAM_API_ID oder TELEGRAM_API_HASH fehlt.");
  console.error("Bitte zuerst in Render/GitHub ENV eintragen.");
  process.exit(1);
}

const stringSession = new StringSession("");

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 Library of Legends Userbot Login");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("Wichtig:");
  console.log("✅ Telefonnummer mit Ländercode eingeben, z. B. +491701234567");
  console.log("✅ Telegram-Code kommt in Telegram auf dein Handy");
  console.log("✅ Session danach NUR in Render ENV speichern");
  console.log("❌ Session niemals öffentlich posten");
  console.log("");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () =>
      await input.text("📱 Telefonnummer vom Userbot-Account: "),

    password: async () =>
      await input.text("🔑 2FA Passwort, falls Telegram danach fragt: "),

    phoneCode: async () =>
      await input.text("💬 Telegram Login-Code: "),

    onError: (err) => {
      console.error("❌ Login-Fehler:", err);
    },
  });

  console.log("");
  console.log("✅ Userbot erfolgreich eingeloggt.");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👇 Diese komplette Session kopieren:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log(client.session.save());
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Danach in Render eintragen als:");
  console.log("USERBOT_SESSION=deine_kopierte_session");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await client.disconnect();
}

main().catch((error) => {
  console.error("❌ Schwerer Fehler beim Userbot-Login:", error);
  process.exit(1);
});