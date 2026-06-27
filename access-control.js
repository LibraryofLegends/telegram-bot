function getBerlinDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getAdminIds() {
  return String(process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function isAdmin(userId) {
  return getAdminIds().includes(String(userId));
}

async function upsertPendingUser(pgPool, user) {
  const query = `
    INSERT INTO bot_users (
      telegram_user_id,
      username,
      first_name,
      last_name,
      status,
      role,
      search_enabled,
      download_enabled
    )
    VALUES ($1, $2, $3, $4, 'pending', 'member', FALSE, FALSE)
    ON CONFLICT (telegram_user_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    user.id,
    user.username || null,
    user.first_name || null,
    user.last_name || null,
  ];

  const result = await pgPool.query(query, values);
  return result.rows[0];
}

async function approveUser(pgPool, telegramUserId, approvedBy) {
  const query = `
    UPDATE bot_users
    SET
      status = 'approved',
      role = CASE WHEN role IS NULL THEN 'member' ELSE role END,
      search_enabled = TRUE,
      download_enabled = TRUE,
      approved_at = NOW(),
      approved_by = $2,
      updated_at = NOW()
    WHERE telegram_user_id = $1
    RETURNING *;
  `;

  const result = await pgPool.query(query, [telegramUserId, approvedBy]);
  return result.rows[0] || null;
}

async function blockUser(pgPool, telegramUserId) {
  const query = `
    UPDATE bot_users
    SET
      status = 'blocked',
      search_enabled = FALSE,
      download_enabled = FALSE,
      updated_at = NOW()
    WHERE telegram_user_id = $1
    RETURNING *;
  `;

  const result = await pgPool.query(query, [telegramUserId]);
  return result.rows[0] || null;
}

async function getBotUser(pgPool, telegramUserId) {
  const result = await pgPool.query(
    `SELECT * FROM bot_users WHERE telegram_user_id = $1`,
    [telegramUserId]
  );

  return result.rows[0] || null;
}

async function requireApprovedUser(pgPool, telegramUserId) {
  const user = await getBotUser(pgPool, telegramUserId);

  if (!user) {
    return {
      ok: false,
      reason: "not_registered",
      message:
        "❌ Du bist noch nicht freigeschaltet.\n\nSende bitte zuerst:\n!freischaltung",
    };
  }

  if (user.status === "blocked") {
    return {
      ok: false,
      reason: "blocked",
      message: "⛔ Dein Zugriff wurde gesperrt.",
    };
  }

  if (user.status !== "approved") {
    return {
      ok: false,
      reason: "pending",
      message:
        "⏳ Deine Freischaltung wartet noch auf Prüfung durch einen Admin.",
    };
  }

  if (!user.search_enabled) {
    return {
      ok: false,
      reason: "search_disabled",
      message: "⛔ Die Suche ist für dich aktuell nicht freigegeben.",
    };
  }

  return {
    ok: true,
    user,
  };
}

async function getUsageToday(pgPool, telegramUserId) {
  const today = getBerlinDateString();

  const result = await pgPool.query(
    `
    SELECT action_type, COUNT(*)::int AS count
    FROM bot_usage_logs
    WHERE telegram_user_id = $1
      AND usage_date = $2
    GROUP BY action_type;
    `,
    [telegramUserId, today]
  );

  const usage = {
    movie: 0,
    episode: 0,
    season: 0,
    series_all: 0,
  };

  for (const row of result.rows) {
    usage[row.action_type] = row.count;
  }

  return usage;
}

async function canUseDownload(pgPool, telegramUserId, actionType) {
  const user = await getBotUser(pgPool, telegramUserId);

  if (!user || user.status !== "approved" || !user.download_enabled) {
    return {
      ok: false,
      message: "⛔ Du bist für das Holen von Inhalten nicht freigeschaltet.",
    };
  }

  if (user.role === "admin") {
    return {
      ok: true,
      user,
      usage: null,
      remaining: "unbegrenzt",
    };
  }

  const usage = await getUsageToday(pgPool, telegramUserId);

  const limits = {
    movie: user.daily_movie_limit,
    episode: user.daily_movie_limit,
    season: user.daily_season_limit,
    series_all: user.daily_series_limit,
  };

  const limit = limits[actionType] ?? 0;
  const used = usage[actionType] ?? 0;

  if (limit <= 0) {
    return {
      ok: false,
      user,
      usage,
      message: "⛔ Diese Funktion ist für deine Rolle aktuell nicht freigegeben.",
    };
  }

  if (used >= limit) {
    return {
      ok: false,
      user,
      usage,
      message:
        `⛔ Tageslimit erreicht.\n\n` +
        `Heute genutzt: ${used}/${limit}\n` +
        `Morgen ist dein Limit wieder frei.`,
    };
  }

  return {
    ok: true,
    user,
    usage,
    remaining: limit - used,
  };
}

async function logUsage(pgPool, telegramUserId, actionType, itemId) {
  const today = getBerlinDateString();

  await pgPool.query(
    `
    INSERT INTO bot_usage_logs (
      telegram_user_id,
      action_type,
      item_id,
      usage_date
    )
    VALUES ($1, $2, $3, $4);
    `,
    [telegramUserId, actionType, String(itemId || ""), today]
  );
}

module.exports = {
  isAdmin,
  upsertPendingUser,
  approveUser,
  blockUser,
  getBotUser,
  requireApprovedUser,
  getUsageToday,
  canUseDownload,
  logUsage,
};