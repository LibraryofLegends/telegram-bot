'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);

class FFmpegManager {

    constructor(options = {}) {

        this.ffprobe =
            options.ffprobe ??
            process.env.FFPROBE_PATH ??
            "ffprobe";

    }

    /**
     * Analysiert eine Mediendatei.
     *
     * @param {String} file
     * @returns {Promise<Object>}
     */
    async analyze(file) {

        const { stdout } = await exec(

            this.ffprobe,

            [

                "-v",
                "quiet",

                "-print_format",
                "json",

                "-show_format",

                "-show_streams",

                file

            ]

        );

        const data = JSON.parse(stdout);

        return this.parse(data);

    }

    /**
     * Daten auswerten.
     *
     * @param {Object} info
     */
    parse(info) {

        const result = {

            duration: null,

            bitrate: null,

            container: null,

            size: null,

            video: null,

            audio: [],

            subtitles: []

        };

        if (info.format) {

            result.duration =
                Number(info.format.duration);

            result.bitrate =
                Number(info.format.bit_rate);

            result.container =
                info.format.format_name;

            result.size =
                Number(info.format.size);

        }

        for (const stream of info.streams ?? []) {

            switch (stream.codec_type) {

                case "video":

                    result.video = this.parseVideo(stream);
                    break;

                case "audio":

                    result.audio.push(
                        this.parseAudio(stream)
                    );

                    break;

                case "subtitle":

                    result.subtitles.push(
                        this.parseSubtitle(stream)
                    );

                    break;

            }

        }

        return result;

    }

    /**
     * Videostream.
     */
    parseVideo(stream) {

        return {

            codec:
                stream.codec_name,

            profile:
                stream.profile,

            width:
                stream.width,

            height:
                stream.height,

            fps:
                stream.r_frame_rate,

            bitDepth:
                stream.bits_per_raw_sample,

            pixelFormat:
                stream.pix_fmt,

            hdr:
                stream.color_transfer,

            language:
                stream.tags?.language

        };

    }

    /**
     * Audiostream.
     */
    parseAudio(stream) {

        return {

            codec:
                stream.codec_name,

            channels:
                stream.channels,

            sampleRate:
                stream.sample_rate,

            bitrate:
                stream.bit_rate,

            language:
                stream.tags?.language,

            title:
                stream.tags?.title

        };

    }

    /**
     * Untertitel.
     */
    parseSubtitle(stream) {

        return {

            codec:
                stream.codec_name,

            language:
                stream.tags?.language,

            title:
                stream.tags?.title

        };

    }

}

module.exports = FFmpegManager;