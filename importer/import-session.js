const IMPORT_SESSIONS = new Map();

function updateImportSession(parsed) {

    if (!["series", "season"].includes(parsed.type)) {
        return null;
    }

    const key = `${parsed.title}::S${parsed.season}`;

    if (!IMPORT_SESSIONS.has(key)) {

        IMPORT_SESSIONS.set(key, {
            title: parsed.title,
            season: parsed.season,
            type: parsed.type,
            episodes: new Set(),
            duplicates: 0,
            imported: 0,
            started: Date.now(),
            lastUpdate: Date.now(),
        });

    }

    const session = IMPORT_SESSIONS.get(key);

    if (Array.isArray(parsed.episodes) && parsed.episodes.length) {

        for (const ep of parsed.episodes) {

            if (session.episodes.has(ep)) {
                session.duplicates++;
                continue;
            }

            session.episodes.add(ep);
            session.imported++;

        }

    } else if (parsed.episode !== null && parsed.episode !== undefined) {

        if (session.episodes.has(parsed.episode)) {

            session.duplicates++;

        } else {

            session.episodes.add(parsed.episode);
            session.imported++;

        }

    }

    session.lastUpdate = Date.now();

    return session;

}

function cleanupImportSessions(maxAgeMinutes = 60) {

    const now = Date.now();

    for (const [key, session] of IMPORT_SESSIONS.entries()) {

        const age = now - session.lastUpdate;

        if (age > maxAgeMinutes * 60000) {
            IMPORT_SESSIONS.delete(key);
        }

    }

}

module.exports = {
    IMPORT_SESSIONS,
    updateImportSession,
    cleanupImportSessions,
};