'use strict';

const fs = require('fs');
const path = require('path');

class MediaInfoParser {

    /**
     * Liest Dateiinformationen.
     *
     * @param {Object} result
     * @returns {Promise<Object>}
     */
    async parse(result) {

        if (!result.filePath) {
            return result;
        }

        try {

            const stats = await fs.promises.stat(result.filePath);

            result.fileSize = stats.size;

            result.fileSizeMB = Number(
                (stats.size / 1024 / 1024).toFixed(2)
            );

            result.fileSizeGB = Number(
                (stats.size / 1024 / 1024 / 1024).toFixed(2)
            );

            result.extension = path
                .extname(result.filePath)
                .replace('.', '')
                .toLowerCase();

            result.fileName = path.basename(result.filePath);

            result.directory = path.dirname(result.filePath);

            result.createdAt = stats.birthtime;

            result.modifiedAt = stats.mtime;

        } catch (err) {

            result.mediaInfoError = err.message;

        }

        return result;

    }

    /**
     * Formatiert Bytes.
     *
     * @param {Number} bytes
     * @returns {String}
     */
    formatSize(bytes) {

        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        let size = bytes;

        let index = 0;

        while (size >= 1024 && index < units.length - 1) {

            size /= 1024;

            index++;

        }

        return `${size.toFixed(2)} ${units[index]}`;

    }

}

module.exports = MediaInfoParser;