require("dotenv").config();

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

function registerUserbotSessionSetup(app) {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const setupKey = process.env.USERBOT_SETUP_KEY;

  let state = null;

  app.use(require("express").urlencoded({ extended: true }));

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function makeDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  }

  function requireSetupKey(req, res, next) {
    if (!setupKey) {
      return res.status(403).send(`
        <h2>Userbot Setup ist deaktiviert</h2>
        <p>Bitte zuerst USERBOT_SETUP_KEY in Render ENV setzen.</p>
      `);
    }

    const incomingKey = req.query.key || req.body.key;

    if (incomingKey !== setupKey) {
      return res.status(403).send(`
        <h2>Zugriff verweigert</h2>
        <p>Setup-Key ist falsch oder fehlt.</p>
      `);
    }

    next();
  }

  async function ask(stage, extra = {}) {
    state.stage = stage;
    Object.assign(state, extra);

    state.prompt = makeDeferred();

    return await state.prompt.promise;
  }

  async function startLoginFlow() {
    if (!apiId || !apiHash) {
      state.stage = "error";
      state.error = "TELEGRAM_API_ID oder TELEGRAM_API_HASH fehlt.";
      return;
    }

    const client = new TelegramClient(
      new StringSession(""),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );

    state.client = client;

    try {
      await client.start({
        phoneNumber: async () => {
          return await ask("phone");
        },

        phoneCode: async () => {
          return await ask("code");
        },

        password: async (hint) => {
          return await ask("password", {
            passwordHint: hint || "",
          });
        },

        onError: (err) => {
          state.error = err?.message || String(err);
          console.error("❌ Userbot Login Fehler:", err);
        },
      });

      state.session = client.session.save();
      state.stage = "done";

      await client.disconnect();
    } catch (error) {
      state.stage = "error";
      state.error = error?.message || String(error);

      try {
        await client.disconnect();
      } catch (_) {}
    }
  }

  function renderPage(key) {
    const current = state || { stage: "idle" };
    const errorBox = current.error
      ? `<div style="background:#ffe6e6;padding:12px;border-radius:8px;margin:12px 0;">
          <b>Fehler:</b> ${escapeHtml(current.error)}
        </div>`
      : "";

    let body = "";

    if (current.stage === "idle") {
      body = `
        <p>Starte hier den einmaligen Telegram-Login für deinen Userbot.</p>
        <form method="POST" action="/userbot-setup/start">
          <input type="hidden" name="key" value="${escapeHtml(key)}" />
          <button type="submit">Userbot Login starten</button>
        </form>
      `;
    }

    if (current.stage === "starting" || current.stage === "waiting") {
      body = `
        <p>Bitte kurz warten...</p>
        <p>Die Seite aktualisiert sich automatisch.</p>
        <meta http-equiv="refresh" content="2">
      `;
    }

    if (current.stage === "phone") {
      body = `
        <p>Gib die Telefonnummer vom Userbot-Account ein.</p>
        <p>Beispiel: <b>+491701234567</b></p>
        <form method="POST" action="/userbot-setup/submit">
          <input type="hidden" name="key" value="${escapeHtml(key)}" />
          <input name="value" placeholder="+49..." style="width:100%;padding:12px;" autocomplete="off" />
          <br><br>
          <button type="submit">Telefonnummer senden</button>
        </form>
      `;
    }

    if (current.stage === "code") {
      body = `
        <p>Telegram hat dir jetzt einen Login-Code geschickt.</p>
        <p>Gib nur den Code ein, nicht die ganze Nachricht.</p>
        <form method="POST" action="/userbot-setup/submit">
          <input type="hidden" name="key" value="${escapeHtml(key)}" />
          <input name="value" placeholder="Telegram-Code" style="width:100%;padding:12px;" autocomplete="off" />
          <br><br>
          <button type="submit">Code senden</button>
        </form>
      `;
    }

    if (current.stage === "password") {
      body = `
        <p>Telegram verlangt dein 2FA-Passwort.</p>
        ${
          current.passwordHint
            ? `<p>Hinweis: ${escapeHtml(current.passwordHint)}</p>`
            : ""
        }
        <form method="POST" action="/userbot-setup/submit">
          <input type="hidden" name="key" value="${escapeHtml(key)}" />
          <input name="value" type="password" placeholder="2FA Passwort" style="width:100%;padding:12px;" />
          <br><br>
          <button type="submit">Passwort senden</button>
        </form>
      `;
    }

    if (current.stage === "done") {
      body = `
        <h2>✅ Session wurde erzeugt</h2>
        <p>Kopiere die komplette Session und speichere sie in Render als <b>USERBOT_SESSION</b>.</p>
        <textarea style="width:100%;height:180px;padding:12px;">${escapeHtml(current.session)}</textarea>
        <p><b>Wichtig:</b> Diese Session niemals öffentlich posten.</p>
      `;
    }

    if (current.stage === "error") {
      body = `
        <p>Der Login ist fehlgeschlagen.</p>
        <form method="POST" action="/userbot-setup/reset">
          <input type="hidden" name="key" value="${escapeHtml(key)}" />
          <button type="submit">Neu starten</button>
        </form>
      `;
    }

    return `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Library of Legends Userbot Setup</title>
        </head>
        <body style="font-family:Arial,sans-serif;max-width:720px;margin:40px auto;padding:20px;">
          <h1>🔐 Library of Legends Userbot Setup</h1>
          ${errorBox}
          ${body}
        </body>
      </html>
    `;
  }

  app.get("/userbot-setup", requireSetupKey, (req, res) => {
    res.send(renderPage(req.query.key));
  });

  app.post("/userbot-setup/start", requireSetupKey, (req, res) => {
    state = {
      stage: "starting",
      error: null,
      session: null,
      prompt: null,
      client: null,
    };

    startLoginFlow();

    res.redirect(`/userbot-setup?key=${encodeURIComponent(req.body.key)}`);
  });

  app.post("/userbot-setup/submit", requireSetupKey, (req, res) => {
    if (!state || !state.prompt) {
      return res.redirect(`/userbot-setup?key=${encodeURIComponent(req.body.key)}`);
    }

    const value = String(req.body.value || "").trim();

    if (!value) {
      state.error = "Eingabe war leer.";
      return res.redirect(`/userbot-setup?key=${encodeURIComponent(req.body.key)}`);
    }

    const resolver = state.prompt.resolve;

    state.prompt = null;
    state.stage = "waiting";

    resolver(value);

    res.redirect(`/userbot-setup?key=${encodeURIComponent(req.body.key)}`);
  });

  app.post("/userbot-setup/reset", requireSetupKey, async (req, res) => {
    if (state?.client) {
      try {
        await state.client.disconnect();
      } catch (_) {}
    }

    state = null;

    res.redirect(`/userbot-setup?key=${encodeURIComponent(req.body.key)}`);
  });

  console.log("🔐 Userbot Session Setup Route aktiv: /userbot-setup");
}

module.exports = {
  registerUserbotSessionSetup,
};