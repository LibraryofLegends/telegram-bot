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
  const result = await pgPool.query(
    `
    INSERT INTO bot_users (
      telegram_user_id,
      username,
      first_name,
      last_name,
      status,
      role,
      search_enabled,
      download_enabled,
      requested_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      'pending',
      'member',
      FALSE,
      FALSE,
      NOW(),
      NOW()
    )
    ON CONFLICT (telegram_user_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      status = CASE
        WHEN bot_users.status = 'approved' THEN 'approved'
        WHEN bot_users.status = 'blocked' THEN 'blocked'
        ELSE 'pending'
      END,
      search_enabled = CASE
        WHEN bot_users.status = 'approved' THEN bot_users.search_enabled
        ELSE FALSE
      END,
      download_enabled = CASE
        WHEN bot_users.status = 'approved' THEN bot_users.download_enabled
        ELSE FALSE
      END,
      requested_at = CASE
        WHEN bot_users.status = 'approved' THEN bot_users.requested_at
        ELSE NOW()
      END,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      user.id,
      user.username || null,
      user.first_name || null,
      user.last_name || null
    ]
  );

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
  episode: user.daily_episode_limit ?? user.daily_movie_limit,
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

function normalizeLimitType(type = "") {
  const value = String(type || "").trim().toLowerCase();

  if (["film", "filme", "movie", "movies"].includes(value)) {
    return {
      column: "daily_movie_limit",
      label: "Filme"
    };
  }

  if (["folge", "folgen", "episode", "episodes"].includes(value)) {
    return {
      column: "daily_episode_limit",
      label: "Einzelne Folgen"
    };
  }

  if (["staffel", "staffeln", "season", "seasons"].includes(value)) {
    return {
      column: "daily_season_limit",
      label: "Staffeln"
    };
  }

  if (["serie", "serien", "series", "series_all", "alle"].includes(value)) {
    return {
      column: "daily_series_limit",
      label: "Ganze Serien"
    };
  }

  return null;
}

async function setUserLimit(pgPool, telegramUserId, limitType, limitValue) {
  const normalized = normalizeLimitType(limitType);

  if (!normalized) {
    return {
      ok: false,
      reason: "invalid_limit_type",
      message:
        "❌ Unbekannter Limit-Typ.\n\n" +
        "Erlaubt sind:\n" +
        "filme, folgen, staffeln, serien"
    };
  }

  const numericLimit = Number(limitValue);

  if (!Number.isInteger(numericLimit) || numericLimit < 0 || numericLimit > 999) {
    return {
      ok: false,
      reason: "invalid_limit_value",
      message: "❌ Limit muss eine Zahl zwischen 0 und 999 sein."
    };
  }

  const allowedColumns = [
    "daily_movie_limit",
    "daily_episode_limit",
    "daily_season_limit",
    "daily_series_limit"
  ];

  if (!allowedColumns.includes(normalized.column)) {
    throw new Error("Unsafe limit column");
  }

  const result = await pgPool.query(
    `
    UPDATE bot_users
    SET
      ${normalized.column} = $2,
      updated_at = NOW()
    WHERE telegram_user_id = $1
    RETURNING *;
    `,
    [telegramUserId, numericLimit]
  );

  const user = result.rows[0] || null;

  if (!user) {
    return {
      ok: false,
      reason: "user_not_found",
      message:
        `❌ User ${telegramUserId} wurde nicht gefunden.\n\n` +
        `Der User muss zuerst !freischaltung senden.`
    };
  }

  return {
    ok: true,
    user,
    label: normalized.label,
    value: numericLimit
  };
}

async function setUserRole(pgPool, telegramUserId, role) {
  const cleanRole = String(role || "").trim().toLowerCase();

  const allowedRoles = ["member", "vip", "admin"];

  if (!allowedRoles.includes(cleanRole)) {
    return {
      ok: false,
      reason: "invalid_role",
      message:
        "❌ Ungültige Rolle.\n\n" +
        "Erlaubt sind:\n" +
        "member, vip, admin"
    };
  }

  const roleDefaults = {
    member: {
      daily_movie_limit: 3,
      daily_episode_limit: 3,
      daily_season_limit: 1,
      daily_series_limit: 0
    },
    vip: {
      daily_movie_limit: 5,
      daily_episode_limit: 5,
      daily_season_limit: 2,
      daily_series_limit: 0
    },
    admin: {
      daily_movie_limit: 999,
      daily_episode_limit: 999,
      daily_season_limit: 999,
      daily_series_limit: 999
    }
  };

  const defaults = roleDefaults[cleanRole];

  const result = await pgPool.query(
    `
    UPDATE bot_users
    SET
      role = $2,
      daily_movie_limit = $3,
      daily_episode_limit = $4,
      daily_season_limit = $5,
      daily_series_limit = $6,
      updated_at = NOW()
    WHERE telegram_user_id = $1
    RETURNING *;
    `,
    [
      telegramUserId,
      cleanRole,
      defaults.daily_movie_limit,
      defaults.daily_episode_limit,
      defaults.daily_season_limit,
      defaults.daily_series_limit
    ]
  );

  const user = result.rows[0] || null;

  if (!user) {
    return {
      ok: false,
      reason: "user_not_found",
      message:
        `❌ User ${telegramUserId} wurde nicht gefunden.\n\n` +
        `Der User muss zuerst !freischaltung senden.`
    };
  }

  return {
    ok: true,
    user
  };
}

async function getFullUserInfo(pgPool, telegramUserId) {
  const user = await getBotUser(pgPool, telegramUserId);

  if (!user) {
    return null;
  }

  const usage = await getUsageToday(pgPool, telegramUserId);

  return {
    user,
    usage
  };
}

async function removeUserAccess(pgPool, telegramUserId) {
  const result = await pgPool.query(
    `
    UPDATE bot_users
    SET
      status = 'rejected',
      role = 'member',
      search_enabled = FALSE,
      download_enabled = FALSE,
      daily_movie_limit = 3,
      daily_episode_limit = 3,
      daily_season_limit = 1,
      daily_series_limit = 0,
      updated_at = NOW()
    WHERE telegram_user_id = $1
    RETURNING *;
    `,
    [telegramUserId]
  );

  const user = result.rows[0] || null;

  if (!user) {
    return {
      ok: false,
      message: `❌ User ${telegramUserId} wurde nicht gefunden.`
    };
  }

  return {
    ok: true,
    user
  };
}

function normalizeUserStatus(status = "") {
  const value = String(status || "").trim().toLowerCase();

  if (["pending", "offen", "anfragen", "wartend"].includes(value)) {
    return "pending";
  }

  if (["approved", "frei", "freigegeben", "aktiv"].includes(value)) {
    return "approved";
  }

  if (["blocked", "gesperrt", "sperre"].includes(value)) {
    return "blocked";
  }

  if (["rejected", "entfernt", "removed", "abgelehnt"].includes(value)) {
    return "rejected";
  }

  if (["all", "alle", "gesamt"].includes(value)) {
    return "all";
  }

  return null;
}

async function getUserStats(pgPool) {
  const result = await pgPool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'blocked')::int AS blocked,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,

      COUNT(*) FILTER (WHERE role = 'member')::int AS member,
      COUNT(*) FILTER (WHERE role = 'vip')::int AS vip,
      COUNT(*) FILTER (WHERE role = 'admin')::int AS admin
    FROM bot_users;
  `);

  return result.rows[0] || {
    total: 0,
    pending: 0,
    approved: 0,
    blocked: 0,
    rejected: 0,
    member: 0,
    vip: 0,
    admin: 0
  };
}

async function getUsersByStatus(pgPool, status = "pending", limit = 30) {
  const cleanStatus = normalizeUserStatus(status);

  if (!cleanStatus) {
    return {
      ok: false,
      reason: "invalid_status",
      users: []
    };
  }

  const cleanLimit = Math.max(
    1,
    Math.min(Number(limit) || 30, 50)
  );

  let result;

  if (cleanStatus === "all") {
    result = await pgPool.query(
      `
      SELECT
        telegram_user_id,
        username,
        first_name,
        last_name,
        status,
        role,
        search_enabled,
        download_enabled,
        daily_movie_limit,
        daily_episode_limit,
        daily_season_limit,
        daily_series_limit,
        requested_at,
        approved_at,
        updated_at
      FROM bot_users
      ORDER BY
        CASE status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          WHEN 'rejected' THEN 2
          WHEN 'blocked' THEN 3
          ELSE 4
        END,
        updated_at DESC NULLS LAST,
        requested_at DESC NULLS LAST
      LIMIT $1;
      `,
      [cleanLimit]
    );
  } else {
    result = await pgPool.query(
      `
      SELECT
        telegram_user_id,
        username,
        first_name,
        last_name,
        status,
        role,
        search_enabled,
        download_enabled,
        daily_movie_limit,
        daily_episode_limit,
        daily_season_limit,
        daily_series_limit,
        requested_at,
        approved_at,
        updated_at
      FROM bot_users
      WHERE status = $1
      ORDER BY
        updated_at DESC NULLS LAST,
        requested_at DESC NULLS LAST
      LIMIT $2;
      `,
      [cleanStatus, cleanLimit]
    );
  }

  return {
    ok: true,
    status: cleanStatus,
    users: result.rows || []
  };
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
  setUserLimit,
  setUserRole,
  getFullUserInfo,
  removeUserAccess,
  getUserStats,
  getUsersByStatus,
};