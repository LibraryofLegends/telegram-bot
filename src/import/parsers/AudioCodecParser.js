'use strict';

/**
 * ============================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------
 * AudioCodecParser
 * ------------------------------------------------------------
 * Erkennt Audio-Codecs:
 *
 * AC3
 * EAC3
 * DD
 * DD+
 * TrueHD
 * Atmos
 * DTS
 * DTS-HD
 * DTS-HD MA
 * DTS:X
 * AAC
 * FLAC
 * PCM
 * LPCM
 * Opus
 * Vorbis
 * MP2
 * MP3
 * WAV
 * ALAC
 * ============================================================
 */

class AudioCodecParser {

    constructor() {

        this.codecs = [

            {
                regex: /\bTRUEHD\b/i,
                codec: "Dolby TrueHD",
                short: "TrueHD",
                score: 100
            },

            {
                regex: /\bATMOS\b/i,
                codec: "Dolby Atmos",
                short: "Atmos",
                score: 105
            },

            {
                regex: /\bE[\- ]?AC3\b|\bDDP\b|\bDD\+\b/i,
                codec: "Dolby Digital Plus",
                short: "EAC3",
                score: 90
            },

            {
                regex: /\bAC3\b|\bDD\b/i,
                codec: "Dolby Digital",
                short: "AC3",
                score: 75
            },

            {
                regex: /\bDTS[\- ]?X\b/i,
                codec: "DTS:X",
                short: "DTSX",
                score: 104
            },

            {
                regex: /\bDTS[\- ]?HD[\- ]?MA\b/i,
                codec: "DTS-HD Master Audio",
                short: "DTS-HD MA",
                score: 98
            },

            {
                regex: /\bDTS[\- ]?HD\b/i,
                codec: "DTS-HD",
                short: "DTS-HD",
                score: 92
            },

            {
                regex: /\bDTS\b/i,
                codec: "DTS",
                short: "DTS",
                score: 80
            },

            {
                regex: /\bAAC\b/i,
                codec: "AAC",
                short: "AAC",
                score: 70
            },

            {
                regex: /\bFLAC\b/i,
                codec: "FLAC",
                short: "FLAC",
                score: 95
            },

            {
                regex: /\bPCM\b|\bLPCM\b/i,
                codec: "PCM",
                short: "PCM",
                score: 96
            },

            {
                regex: /\bOPUS\b/i,
                codec: "Opus",
                short: "Opus",
                score: 82
            },

            {
                regex: /\bVORBIS\b/i,
                codec: "Vorbis",
                short: "Vorbis",
                score: 65
            },

            {
                regex: /\bALAC\b/i,
                codec: "ALAC",
                short: "ALAC",
                score: 94
            },

            {
                regex: /\bMP3\b/i,
                codec: "MP3",
                short: "MP3",
                score: 30
            },

            {
                regex: /\bMP2\b/i,
                codec: "MP2",
                short: "MP2",
                score: 20
            },

            {
                regex: /\bWAV\b/i,
                codec: "WAV",
                short: "WAV",
                score: 60
            }

        ];

    }

    /**
     * Hauptfunktion
     */
    parse(result) {

        for (const codec of this.codecs) {

            if (!codec.regex.test(result.normalized)) {
                continue;
            }

            result.audioCodec = codec.codec;
            result.audioCodecShort = codec.short;
            result.audioCodecScore = codec.score;

            break;

        }

        this.detectChannels(result);

        this.detectSampleRate(result);

        this.detectBitrate(result);

        return result;

    }
    
        /**
     * Erkennt die Kanalanzahl.
     *
     * Beispiele:
     * 1.0
     * 2.0
     * 2.1
     * 5.1
     * 6.1
     * 7.1
     * 9.1
     *
     * @param {Object} result
     */
    detectChannels(result) {

        const match = result.normalized.match(
            /\b(1\.0|2\.0|2\.1|5\.1|6\.1|7\.1|9\.1)\b/
        );

        if (!match) {
            return;
        }

        result.audioChannels = match[1];

    }

    /**
     * Erkennt die Abtastrate.
     *
     * Beispiele:
     * 44.1kHz
     * 48kHz
     * 96kHz
     * 192kHz
     *
     * @param {Object} result
     */
    detectSampleRate(result) {

        const match = result.normalized.match(
            /\b(44\.1|48|88\.2|96|176\.4|192)\s?KHZ\b/i
        );

        if (!match) {
            return;
        }

        result.sampleRate = Number(match[1]);

    }

    /**
     * Erkennt die Audio-Bitrate.
     *
     * Beispiele:
     * 192kbps
     * 320kbps
     * 640kbps
     * 1536kbps
     *
     * @param {Object} result
     */
    detectBitrate(result) {

        const match = result.normalized.match(
            /\b(\d{2,5})\s?KBPS\b/i
        );

        if (!match) {
            return;
        }

        result.audioBitrate = Number(match[1]);

    }

    /**
     * Erkennt Sprachkennzeichnungen.
     *
     * @param {Object} result
     */
    detectLanguages(result) {

        const languages = [];

        const map = {

            DE: "Deutsch",
            GER: "Deutsch",

            EN: "Englisch",
            ENG: "Englisch",

            FR: "Französisch",
            FRE: "Französisch",
            FRA: "Französisch",

            ES: "Spanisch",

            IT: "Italienisch",

            JP: "Japanisch",
            JPN: "Japanisch"

        };

        for (const code in map) {

            const regex = new RegExp(`\\b${code}\\b`, "i");

            if (!regex.test(result.normalized)) {
                continue;
            }

            if (!languages.includes(map[code])) {

                languages.push(map[code]);

            }

        }

        if (/\bMULTI\b/i.test(result.normalized)) {

            result.multiAudio = true;

        }

        result.audioLanguages = languages;

    }
    
    parse(result) {

    for (const codec of this.codecs) {

        if (!codec.regex.test(result.normalized)) {
            continue;
        }

        result.audioCodec = codec.codec;
        result.audioCodecShort = codec.short;
        result.audioCodecScore = codec.score;

        break;

    }

    this.detectChannels(result);

    this.detectSampleRate(result);

    this.detectBitrate(result);

    this.detectLanguages(result);

    return result;

}