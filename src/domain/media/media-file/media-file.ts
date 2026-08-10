// =========================================================================
// BEST VIDEO (SCORING)
// =========================================================================

public getBestVideo(): VideoStream | null {

    if (this.videoStreams.length === 0) return null;

    return this.videoStreams
        .map(stream => ({
            stream,
            score: this.scoreVideo(stream)
        }))
        .sort((a, b) => b.score - a.score)[0].stream;

}

private scoreVideo(stream: VideoStream): number {

    let score = 0;

    // Resolution
    if (stream.resolution.toString() === "4K") score += 100;
    if (stream.resolution.toString() === "1080p") score += 70;
    if (stream.resolution.toString() === "720p") score += 40;

    // Codec
    if (stream.codec.toString() === "H265") score += 30;
    if (stream.codec.toString() === "H264") score += 10;
    if (stream.codec.toString() === "AV1") score += 40;

    return score;

}

// =========================================================================
// BEST AUDIO (SCORING)
// =========================================================================

public getBestAudio(): AudioStream | null {

    if (this.audioStreams.length === 0) return null;

    return this.audioStreams
        .map(stream => ({
            stream,
            score: this.scoreAudio(stream)
        }))
        .sort((a, b) => b.score - a.score)[0].stream;

}

private scoreAudio(stream: AudioStream): number {

    let score = 0;

    // Language priority
    if (stream.language.isGerman()) score += 100;
    if (stream.language.isEnglish()) score += 70;

    // Codec quality
    if (stream.codec.toString() === "TRUEHD") score += 80;
    if (stream.codec.toString() === "DTS") score += 60;
    if (stream.codec.toString() === "EAC3") score += 40;
    if (stream.codec.toString() === "AC3") score += 30;
    if (stream.codec.toString() === "AAC") score += 10;

    // Channels
    if (stream.channels.toString() === "7.1") score += 50;
    if (stream.channels.toString() === "5.1") score += 30;
    if (stream.channels.toString() === "2.0") score += 10;

    return score;

}

// =========================================================================
// BEST SUBTITLES (SCORING)
// =========================================================================

public getBestSubtitles(): SubtitleStream | null {

    if (this.subtitleStreams.length === 0) return null;

    return this.subtitleStreams
        .map(stream => ({
            stream,
            score: this.scoreSubtitle(stream)
        }))
        .sort((a, b) => b.score - a.score)[0].stream;

}

private scoreSubtitle(stream: SubtitleStream): number {

    let score = 0;

    // Type priority
    if (stream.type.isForced()) score += 100;
    if (stream.type.isFull()) score += 50;
    if (stream.type.isSDH()) score += 30;

    // Language
    if (stream.language.isGerman()) score += 80;
    if (stream.language.isEnglish()) score += 60;

    // Format bonus
    if (stream.format.isImage()) score += 40; // PGS (BluRay)
    if (stream.format.isText()) score += 20;

    return score;

}