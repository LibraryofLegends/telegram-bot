/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/models/File.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Datenmodell einer Mediendatei.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseModel = require('./BaseModel');

class File extends BaseModel {

    constructor(data = {}) {

        super({

            id: null,

            media_type: '',

            media_id: null,

            file_name: '',

            original_name: '',

            extension: '',

            mime_type: '',

            file_size: 0,

            checksum: '',

            path: '',

            telegram_chat_id: null,

            telegram_message_id: null,

            telegram_file_id: '',

            telegram_unique_file_id: '',

            uploaded_at: null,

            imported_at: null,

            status: 'pending',

            library_id: '',

            created_at: null,

            updated_at: null,

            deleted_at: null,

            ...data

        });

    }

}

module.exports = File;