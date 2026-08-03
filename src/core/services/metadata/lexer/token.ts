/*
===============================================================================
██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗   ██╗
██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
██║     ██║██████╔╝██████╔╝███████║██████╔╝ ╚████╔╝
██║     ██║██╔══██╗██╔══██╗██╔══██║██╔══██╗  ╚██╔╝
███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║   ██║
╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝

                         PROJECT PHOENIX

===============================================================================

Project.............: Library Of Legends
Framework...........: LOAF

Module..............: Metadata
Package.............: Lexer

Component...........: Token

LOL-ID..............: LOL-LEXER-0002

File................: token.ts

Location............: src/core/services/metadata/lexer/token.ts

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Represents a single lexical token.

Every filename processed by Project Phoenix is converted into
a list of Token objects.

Tokens are immutable data objects that contain both the detected
value and contextual information used by parsers, validators and AI.

===============================================================================
*/

/*
===============================================================================
ROADMAP
===============================================================================

[x] Immutable Token Model

[x] Confidence Score

[x] Character Position

[x] Metadata Support

[ ] AI Confidence

[ ] Parser History

[ ] Correction Tracking

[ ] Token Flags

===============================================================================
*/

/*
===============================================================================
CHANGELOG
===============================================================================

1.0.0

- Initial implementation

===============================================================================
*/

/*
===============================================================================
IMPORTS
===============================================================================
*/

import { TokenType } from "./token-type";

/*
===============================================================================
INTERFACES
===============================================================================
*/

/**
 * Additional metadata attached to a token.
 */
export interface TokenMetadata {

    source?: string;

    parser?: string;

    normalized?: boolean;

    confidenceReason?: string;

    tags?: string[];

}

/*
===============================================================================
TOKEN
===============================================================================
*/

/**
 * Represents a single lexical token.
 */
export class Token {

    constructor(

        /**
         * Token classification.
         */
        public readonly type: TokenType,

        /**
         * Original token value.
         */
        public readonly value: string,

        /**
         * Character index where the token starts.
         */
        public readonly start: number,

        /**
         * Character index where the token ends.
         */
        public readonly end: number,

        /**
         * Detection confidence (0.0 - 1.0).
         */
        public readonly confidence: number = 1.0,

        /**
         * Additional metadata.
         */
        public readonly metadata: TokenMetadata = {}

    ) {}

    /**
     * Length of the token.
     */
    public get length(): number {

        return this.end - this.start + 1;

    }

    /**
     * Returns whether the token has maximum confidence.
     */
    public get isCertain(): boolean {

        return this.confidence >= 0.99;

    }

    /**
     * Returns whether the token has low confidence.
     */
    public get isUncertain(): boolean {

        return this.confidence < 0.75;

    }

    /**
     * Returns a readable debug string.
     */
    public toString(): string {

        return `[${TokenType[this.type]}] "${this.value}" (${this.start}-${this.end})`;

    }

}