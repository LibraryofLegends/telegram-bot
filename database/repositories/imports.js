async function saveUserbotImport(pgPool, data) {
    if (!pgPool) return null;

    try {
        const result = await pgPool.query(
            `
            INSERT INTO userbot_imports (
                unique_key,
                source_chat,
                staging_chat,
                source_message_id,
                staging_message_id,
                media_type,
                title,
                year,
                season,
                episode,
                episode_title,
                file_name,
                file_size,
                mime_type,
                width,
                height,
                duration_minutes,
                quality,
                media_source,
                codec,
                audio,
                status,
                raw_json
            )
            VALUES (
                $1,$2,$3,$4,$5,
                $6,$7,$8,$9,$10,$11,
                $12,$13,$14,$15,$16,$17,
                $18,$19,$20,$21,
                $22,$23
            )
            ON CONFLICT (unique_key)
            DO UPDATE SET
                staging_message_id = EXCLUDED.staging_message_id,
                media_type = EXCLUDED.media_type,
                title = EXCLUDED.title,
                year = EXCLUDED.year,
                season = EXCLUDED.season,
                episode = EXCLUDED.episode,
                episode_title = EXCLUDED.episode_title,
                file_name = EXCLUDED.file_name,
                file_size = EXCLUDED.file_size,
                mime_type = EXCLUDED.mime_type,
                width = EXCLUDED.width,
                height = EXCLUDED.height,
                duration_minutes = EXCLUDED.duration_minutes,
                quality = EXCLUDED.quality,
                media_source = EXCLUDED.media_source,
                codec = EXCLUDED.codec,
                audio = EXCLUDED.audio,
                raw_json = EXCLUDED.raw_json,
                updated_at = NOW()
            RETURNING id;
            `,
            [
                data.uniqueKey,
                data.sourceChat,
                data.stagingChat,
                data.sourceMessageId,
                data.stagingMessageId,
                data.mediaType,
                data.title,
                data.year,
                data.season,
                data.episode,
                data.episodeTitle,
                data.fileName,
                data.fileSize,
                data.mimeType,
                data.width,
                data.height,
                data.durationMinutes,
                data.quality,
                data.mediaSource,
                data.codec,
                data.audio,
                data.status || "staged",
                data.rawJson,
            ]
        );

        return result.rows[0]?.id || null;
    } catch (error) {
        console.error(
            "❌ Supabase Userbot Import Speicherfehler:",
            error.message
        );

        return null;
    }
}

module.exports = {
    saveUserbotImport,
};