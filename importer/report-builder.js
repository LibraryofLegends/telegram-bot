function buildImportReport({

    fileName,
    parsed,
    fileSize,
    mimeType,
    videoMeta,
    importSession = null,

}) {

    let typeLabel = "🎬 Film";

    if (parsed.type === "series")
        typeLabel = "📺 Serie";

    if (parsed.type === "season")
        typeLabel = "📦 Staffel";

    const lines = [];

    lines.push("🧠 USERBOT IMPORT");
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push(`${typeLabel} erkannt`);
    lines.push("");

    lines.push(`📂 Datei: ${fileName}`);
    lines.push(`🏷 Titel: ${parsed.title}`);

    if (parsed.year)
        lines.push(`📅 Jahr: ${parsed.year}`);

    if (parsed.type === "series") {

        lines.push(
            `📀 Staffel: ${String(parsed.season).padStart(2, "0")}`
        );

        lines.push(
            `🎞 Episode: ${String(parsed.episode).padStart(2, "0")}`
        );

        if (parsed.episodes?.length > 1) {

            lines.push(
                `🎬 Doppelfolge: ${parsed.episodes.join(", ")}`
            );

        }

        if (parsed.special)
            lines.push("⭐ Special");

        if (parsed.ova)
            lines.push("🎌 OVA");

        if (parsed.episodeTitle)
            lines.push(`📝 Titel: ${parsed.episodeTitle}`);

    }

    if (parsed.type === "season") {

        lines.push(
            `📀 Staffel: ${String(parsed.season).padStart(2, "0")}`
        );

    }

    if (parsed.quality)
        lines.push(`🔥 Qualität: ${parsed.quality}`);

    if (parsed.source)
        lines.push(`📡 Quelle: ${parsed.source}`);

    if (parsed.codec)
        lines.push(`🎥 Codec: ${parsed.codec}`);

    if (parsed.audio)
        lines.push(`🔊 Audio: ${parsed.audio}`);

    if (fileSize)
        lines.push(`💾 Größe: ${fileSize}`);

    if (mimeType)
        lines.push(`🧾 MIME: ${mimeType}`);

    if (videoMeta?.width && videoMeta?.height) {

        lines.push(
            `📺 Auflösung: ${videoMeta.width}x${videoMeta.height}`
        );

    }

    if (videoMeta?.duration) {

        lines.push(
            `⏱ Dauer: ${Math.round(videoMeta.duration / 60)} Min.`
        );

    }

    if (importSession) {

        lines.push("");

        lines.push("━━━━━━━━━━━━━━━━━━━━");
        lines.push("📦 STAFFEL-IMPORT");
        lines.push("━━━━━━━━━━━━━━━━━━━━");

        lines.push(`🎬 Serie: ${importSession.title}`);

        lines.push(
            `📀 Staffel: ${String(importSession.season).padStart(2, "0")}`
        );

        lines.push(
            `✅ Erkannte Episoden: ${importSession.episodes.size}`
        );

        lines.push(
            `📥 Neue Episoden: ${importSession.imported}`
        );

        if (importSession.duplicates > 0) {

            lines.push(
                `⚠ Doppelte Episoden: ${importSession.duplicates}`
            );

        }

    }

    lines.push("");
    lines.push("✅ Datei wurde in die Staging-Gruppe weitergeleitet.");

    return lines.join("\n");

}

module.exports = {
    buildImportReport,
};