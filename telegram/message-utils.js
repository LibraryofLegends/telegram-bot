function extractForwardedMessageId(result) {
    if (!result) return null;

    if (Array.isArray(result)) {
        for (const item of result) {
            const found = extractForwardedMessageId(item);
            if (found) return found;
        }
    }

    if (result.id) return String(result.id);

    if (result.message?.id)
        return String(result.message.id);

    if (Array.isArray(result.updates)) {
        for (const update of result.updates) {
            const found = extractForwardedMessageId(update);
            if (found) return found;
        }
    }

    if (
        result.updates?.updates &&
        Array.isArray(result.updates.updates)
    ) {
        for (const update of result.updates.updates) {
            const found = extractForwardedMessageId(update);
            if (found) return found;
        }
    }

    return null;
}

module.exports = {
    extractForwardedMessageId,
};