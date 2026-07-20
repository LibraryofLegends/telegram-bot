async function resolveChat(client, reference, label) {
    const ref = String(reference || "").trim();

    if (!ref) {
        throw new Error(`${label} fehlt in Render ENV.`);
    }

    try {
        return await client.getEntity(ref);
    } catch (_) {
        // Falls direkte Suche nicht klappt,
        // suchen wir in den sichtbaren Dialogen.
    }

    const dialogs = await client.getDialogs({ limit: 100 });

    const normalizedRef = ref.toLowerCase();

    const match = dialogs.find((dialog) => {
        const name = String(
            dialog.name ||
            dialog.title ||
            dialog.entity?.title ||
            ""
        ).trim();

        const id = String(
            dialog.id ||
            dialog.entity?.id ||
            ""
        ).trim();

        return (
            id === ref ||
            name === ref ||
            name.toLowerCase() === normalizedRef ||
            name.toLowerCase().includes(normalizedRef)
        );
    });

    if (match?.entity) {
        return match.entity;
    }

    const available = dialogs
        .map((dialog) => dialog.name || dialog.title || dialog.entity?.title)
        .filter(Boolean)
        .slice(0, 25)
        .join(", ");

    throw new Error(
        `${label} konnte nicht gefunden werden: "${ref}". Sichtbare Chats: ${available}`
    );
}

module.exports = {
    resolveChat,
};