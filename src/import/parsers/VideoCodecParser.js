'use strict';

/**
 * ============================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------
 * VideoCodecParser
 * ------------------------------------------------------------
 * Erkennt:
 *
 * H.264
 * AVC
 * x264
 *
 * H.265
 * HEVC
 * x265
 *
 * AV1
 * VP8
 * VP9
 * MPEG2
 * MPEG4
 * DivX
 * XviD
 * VC-1
 * ProRes
 * DNxHD
 * DNxHR
 * FFV1
 * ============================================================
 */

class VideoCodecParser {

    constructor() {

        this.codecs = [

            {
                regex: /\b(X264|H\.?264|AVC)\b/i,
                codec: "H.264 / AVC",
                short: "H264",
                score: 70
            },

            {
                regex: /\b(X265|H\.?265|HEVC)\b/i,
                codec: "H.265 / HEVC",
                short: "H265",
                score: 90
            },

            {
                regex: /\bAV1\b/i,
                codec: "AV1",
                short: "AV1",
                score: 100
            },

            {
                regex: /\bVP9\b/i,
                codec: "VP9",
                short: "VP9",
                score: 80
            },

            {
                regex: /\bVP8\b/i,
                codec: "VP8",
                short: "VP8",
                score: 60
            },

            {
                regex: /\bXVID\b/i,
                codec: "XviD",
                short: "XVID",
                score: 35
            },

            {
                regex: /\bDIVX\b/i,
                codec: "DivX",
                short: "DIVX",
                score: 30
            },

            {
                regex: /\bVC[- ]?1\b/i,
                codec: "VC-1",
                short: "VC1",
                score: 45
            },

            {
                regex: /\bMPEG[- ]?2\b/i,
                codec: "MPEG-2",
                short: "MPEG2",
                score: 20
            },

            {
                regex: /\bMPEG[- ]?4\b/i,
                codec: "MPEG-4",
                short: "MPEG4",
                score: 25
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

            result.videoCodec = codec.codec;
            result.videoCodecShort = codec.short;
            result.videoCodecScore = codec.score;

            break;

        }

        this.detectProfessional(result);

        this.detectBitDepth(result);

        this.detectHDR(result);

        return result;

    }
    
        /**
     * Erkennt professionelle Codecs.
     */
    detectProfessional(result) {

        const codecs = [

            {
                regex: /\bPRORES\b/i,
                codec: "Apple ProRes",
                short: "PRORES",
                score: 95
            },

            {
                regex: /\bDNXHR\b/i,
                codec: "DNxHR",
                short: "DNXHR",
                score: 94
            },

            {
                regex: /\bDNXHD\b/i,
                codec: "DNxHD",
                short: "DNXHD",
                score: 93
            },

            {
                regex: /\bFFV1\b/i,
                codec: "FFV1",
                short: "FFV1",
                score: 98
            }

        ];

        for (const codec of codecs) {

            if (!codec.regex.test(result.normalized)) {
                continue;
            }

            result.videoCodec = codec.codec;
            result.videoCodecShort = codec.short;
            result.videoCodecScore = codec.score;

            return;

        }

    }
    
        /**
     * Erkennt die Farbtiefe.
     *
     * Beispiele:
     * 8Bit
     * 10Bit
     * 12Bit
     * 16Bit
     *
     * @param {Object} result
     */
    detectBitDepth(result) {

        const match = result.normalized.match(/\b(8|10|12|16)[\s-]?BIT\b/i);

        if (!match) {
            return;
        }

        result.bitDepth = Number(match[1]);

    }

    /**
     * Erkennt HDR-Varianten.
     *
     * HDR10
     * HDR10+
     * Dolby Vision
     * HLG
     * SDR
     *
     * @param {Object} result
     */
    detectHDR(result) {

        if (/\bDV\b|\bDOLBY[\s-]?VISION\b/i.test(result.normalized)) {

            result.hdr = "Dolby Vision";

        } else if (/\bHDR10\+\b/i.test(result.normalized)) {

            result.hdr = "HDR10+";

        } else if (/\bHDR10\b/i.test(result.normalized)) {

            result.hdr = "HDR10";

        } else if (/\bHLG\b/i.test(result.normalized)) {

            result.hdr = "HLG";

        } else if (/\bHDR\b/i.test(result.normalized)) {

            result.hdr = "HDR";

        } else if (/\bSDR\b/i.test(result.normalized)) {

            result.hdr = "SDR";

        }

    }

    /**
     * Erkennt die Chroma-Subsampling-Information.
     *
     * Beispiele:
     * 4:2:0
     * 4:2:2
     * 4:4:4
     *
     * @param {Object} result
     */
    detectChroma(result) {

        const match = result.normalized.match(/\b(4:2:0|4:2:2|4:4:4)\b/);

        if (!match) {
            return;
        }

        result.chroma = match[1];

    }

    /**
     * Erkennt Progressive oder Interlaced.
     *
     * @param {Object} result
     */
    detectScanType(result) {

        if (/\bPROGRESSIVE\b|\bPROG\b/i.test(result.normalized)) {

            result.scanType = "Progressive";

            return;

        }

        if (/\bINTERLACED\b|\bINTERLACE\b|\b1080I\b|\b576I\b/i.test(result.normalized)) {

            result.scanType = "Interlaced";

        }

    }
    
    parse(result) {

    for (const codec of this.codecs) {

        if (!codec.regex.test(result.normalized)) {
            continue;
        }

        result.videoCodec = codec.codec;
        result.videoCodecShort = codec.short;
        result.videoCodecScore = codec.score;

        break;

    }

    this.detectProfessional(result);

    this.detectBitDepth(result);

    this.detectHDR(result);

    this.detectChroma(result);

    this.detectScanType(result);

    return result;

}