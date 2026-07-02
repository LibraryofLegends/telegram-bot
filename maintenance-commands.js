const {
  isAdmin,
} = require("./access-control");

async function getMaintenanceMode(pgPool) {
  const result = await pgPool.query(
    `
    SELECT value
    FROM bot_settings
    WHERE key = 'maintenance_mode'
    LIMIT 1;
    `
  );

  return result.rows[0]?.value === "on";
}

async function setMaintenanceMode(pgPool, value) {
  await pgPool.query(
    `
    INSERT INTO bot_settings (key, value, updated_at)
    VALUES ('maintenance_mode', $1, NOW())
    ON CONFLICT (key)
    DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW();
    `,
    [
      value ? "on" : "off"
    ]
  );
}

function buildMaintenanceMessage() {
  return (
    `🛠 Library of Legends wird gerade überarbeitet\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Das Archiv wird aktuell neu sortiert oder aktualisiert.\n\n` +
    `Bitte versuche es später erneut.`
  );
}

async function isMaintenanceBlocked(bot, msg, pgPool) {
  const from =
    msg.from;

  const chatId =
    msg.chat?.id;

  if (!from || !chatId) {
    return false;
  }

  if (isAdmin(from.id)) {
    return false;
  }

  const active =
    await getMaintenanceMode(pgPool);

  if (!active) {
    return false;
  }

  await bot.sendMessage(
    chatId,
    buildMaintenanceMessage(),
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

async function handleMaintenanceCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const from =
    msg.from;

  const chatId =
    msg.chat?.id;

  if (!text || !from || !chatId) {
    return false;
  }

  if (
    !text.startsWith("/maintenance") &&
    !text.startsWith("!maintenance") &&
    !text.startsWith("/wartung") &&
    !text.startsWith("!wartung")
  ) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können den Wartungsmodus ändern.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const lower =
    text.toLowerCase();

  if (
    lower === "/maintenance on" ||
    lower === "!maintenance on" ||
    lower === "/wartung an" ||
    lower === "!wartung an"
  ) {
    await setMaintenanceMode(pgPool, true);

    await bot.sendMessage(
      chatId,
      `🛠 Wartungsmodus aktiviert.\n\nNormale User können das Archiv jetzt vorübergehend nicht nutzen.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (
    lower === "/maintenance off" ||
    lower === "!maintenance off" ||
    lower === "/wartung aus" ||
    lower === "!wartung aus"
  ) {
    await setMaintenanceMode(pgPool, false);

    await bot.sendMessage(
      chatId,
      `✅ Wartungsmodus deaktiviert.\n\nDas Archiv ist wieder für freigeschaltete User nutzbar.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  if (
    lower === "/maintenance status" ||
    lower === "!maintenance status" ||
    lower === "/wartung status" ||
    lower === "!wartung status" ||
    lower === "/maintenance" ||
    lower === "!maintenance" ||
    lower === "/wartung" ||
    lower === "!wartung"
  ) {
    const active =
      await getMaintenanceMode(pgPool);

    await bot.sendMessage(
      chatId,
      active
        ? `🛠 Wartungsmodus ist aktuell AKTIV.`
        : `✅ Wartungsmodus ist aktuell AUS.`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  await bot.sendMessage(
    chatId,
    `🛠 Wartungsmodus\n\n` +
      `Befehle:\n\n` +
      `/maintenance on\n` +
      `/maintenance off\n` +
      `/maintenance status\n\n` +
      `Deutsch:\n\n` +
      `/wartung an\n` +
      `/wartung aus\n` +
      `/wartung status`,
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

module.exports = {
  getMaintenanceMode,
  setMaintenanceMode,
  isMaintenanceBlocked,
  handleMaintenanceCommands,
  buildMaintenanceMessage,
};