/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

          Library Of Legends Application Framework

===============================================================================

Architecture Layer..: Domain

Subsystem...........: Storage

Module..............: Media Engine

Package.............: Value Objects

Component...........: Storage Reference

LOL-ID..............: LOL-STORAGE-0001

File................: storage-reference.ts

Location............: src/media/domain/value-objects/

Dependencies........: None

Dependents..........:
- Asset
- Storage Provider
- Import Pipeline
- Library Database

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents a logical reference to a storage resource.

The domain never directly accesses files.

Access is always performed through a Storage Provider.

===============================================================================
*/

export enum StorageType {

    LOCAL = "local",

    TELEGRAM = "telegram",

    S3 = "s3",

    GOOGLE_DRIVE = "google_drive",

    ONEDRIVE = "onedrive",

    DROPBOX = "dropbox",

    WEBDAV = "webdav",

    FTP = "ftp",

    SMB = "smb",

    HTTP = "http",

    HTTPS = "https"

}

export class StorageReference {

    constructor(

        /**
         * Storage backend.
         */
        public readonly type: StorageType,

        /**
         * Provider specific identifier.
         */
        public readonly identifier: string,

        /**
         * Optional display path.
         */
        public readonly displayPath?: string

    ) {}

    /**
     * Compare references.
     */
    public equals(

        other: StorageReference

    ): boolean {

        return (

            this.type === other.type &&

            this.identifier === other.identifier

        );

    }

    /**
     * Human readable value.
     */
    public toString(): string {

        return this.displayPath ??

            this.identifier;

    }

}