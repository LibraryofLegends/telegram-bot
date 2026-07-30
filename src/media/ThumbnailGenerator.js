'use strict';

const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);

class ThumbnailGenerator {

    constructor(options = {}) {

        this.ffmpeg =
            options.ffmpeg ??
            process.env.FFMPEG_PATH ??
            "ffmpeg";

        this.outputDirectory =
            options.outputDirectory ??
            path.join(process.cwd(), "thumbnails");

    }

    /**
     * Erstellt ein Thumbnail.
     *
     * @param {String} video
     * @param {Number} second
     */
    async create(video, second = 60) {

        await fs.mkdir(

            this.outputDirectory,

            {

                recursive: true

            }

        );

        const output = path.join(

            this.outputDirectory,

            path.basename(video) + ".jpg"

        );

        await exec(

            this.ffmpeg,

            [

                "-y",

                "-ss",

                String(second),

                "-i",

                video,

                "-frames:v",

                "1",

                "-q:v",

                "2",

                output

            ]

        );

        return output;

    }

    /**
     * Mehrere Vorschaubilder erzeugen.
     *
     * @param {String} video
     * @param {Array<Number>} seconds
     */
    async createMultiple(

        video,

        seconds = [

            60,

            300,

            600

        ]

    ) {

        const images = [];

        for (const second of seconds) {

            images.push(

                await this.create(

                    video,

                    second

                )

            );

        }

        return images;

    }

}

module.exports = ThumbnailGenerator;