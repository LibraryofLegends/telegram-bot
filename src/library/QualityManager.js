'use strict';

class QualityManager {

    constructor() {

        this.resolutionScores = {

            "480p": 50,
            "576p": 75,
            "720p": 150,
            "1080p": 250,
            "1440p": 350,
            "2160p": 500,
            "4320p": 700

        };

        this.sourceScores = {

            "CAM": 10,
            "TS": 20,
            "TC": 30,
            "WEBRip": 180,
            "WEB-DL": 250,
            "BluRay": 350,
            "Remux": 500,
            "UHD BluRay": 650

        };

        this.videoScores = {

            "MPEG2": 20,
            "XviD": 40,
            "H264": 120,
            "AVC": 140,
            "H265": 220,
            "HEVC": 250,
            "AV1": 300

        };

        this.audioScores = {

            "AAC": 40,
            "AC3": 60,
            "EAC3": 80,
            "DTS": 120,
            "DTS-HD": 180,
            "DTS-HD MA": 250,
            "TrueHD": 280,
            "Atmos": 320

        };

    }

    /**
     * Qualitätsbewertung.
     *
     * @param {Object} media
     */
    evaluate(media) {

        let score = 0;

        score += this.scoreResolution(media);

        score += this.scoreSource(media);

        score += this.scoreVideo(media);

        score += this.scoreAudio(media);

        score += this.scoreHDR(media);

        score += this.scoreLanguages(media);

        score += this.scoreSubtitles(media);

        score += this.scoreRelease(media);

        media.qualityScore = score;

        media.qualityTier = this.getTier(score);

        return media;

    }

    scoreResolution(media) {

        return this.resolutionScores[
            media.resolution
        ] ?? 0;

    }

    scoreSource(media) {

        return this.sourceScores[
            media.source
        ] ?? 0;

    }

    scoreVideo(media) {

        return this.videoScores[
            media.videoCodec
        ] ?? 0;

    }

    scoreAudio(media) {

        return this.audioScores[
            media.audioCodec
        ] ?? 0;

    }

    scoreHDR(media) {

        if (media.dolbyVision) {

            return 120;

        }

        if (media.hdr10Plus) {

            return 100;

        }

        if (media.hdr10) {

            return 80;

        }

        if (media.hdr) {

            return 50;

        }

        return 0;

    }

    scoreLanguages(media) {

        if (!Array.isArray(media.languages)) {

            return 0;

        }

        return media.languages.length * 15;

    }

    scoreSubtitles(media) {

        if (!Array.isArray(media.subtitles)) {

            return 0;

        }

        return media.subtitles.length * 5;

    }

    scoreRelease(media) {

        return media.releaseScore ?? 0;

    }

    /**
     * Qualitätsstufe.
     */
    getTier(score) {

        if (score >= 1800) {

            return "Reference";

        }

        if (score >= 1500) {

            return "Platinum";

        }

        if (score >= 1200) {

            return "Gold";

        }

        if (score >= 900) {

            return "Silver";

        }

        if (score >= 600) {

            return "Bronze";

        }

        return "Basic";

    }

}

module.exports = QualityManager;